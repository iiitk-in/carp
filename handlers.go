package main

import (
	"encoding/json"
	"log"
	"regexp"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/olahol/melody"
)

var Users []User
var usersMutex sync.Mutex

var adminPass = "password"

var r, _ = regexp.Compile("^[a-zA-Z0-9]{3,15}$")

func handleRegister(c echo.Context) error {
	type RegisterRequest struct {
		Username string `json:"username"`
	}

	// Read json body from request and unmarshal it into User struct
	req := new(RegisterRequest)
	if err := c.Bind(req); err != nil {
		return c.String(400, "Bad Request")
	}

	if !r.MatchString(req.Username) {
		return c.String(400, "Invalid username")
	}

	// Lock the mutex before accessing Users to ensure safe concurrent access
	usersMutex.Lock()
	defer usersMutex.Unlock()

	// Check if username already exists
	for _, user := range Users {
		if user.Username == req.Username {
			return c.String(400, "Username already exists")
		}
	}

	// Create a new user and append it to the Users slice
	user := User{
		UserID:   generateID(),
		Username: req.Username,
	}
	Users = append(Users, user)

	return c.JSON(200, user)
}

type NQDataStruct struct {
	Auth     string   `json:"auth"`
	Question Question `json:"question"`
}

type AnswerMsg struct {
	UserID     string `json:"userID"`
	QuestionID string `json:"questionID"`
	OptionIDs  []int  `json:"optionIDs"`
}

type AdminAnnouncement struct {
	Auth string `json:"auth"`
	Text string `json:"text"`
}

type AdminHint struct {
	Auth      string `json:"auth"`
	QustionID string `json:"questionID"`
	Text      string `json:"text"`
}

func sockHandler(m melody.Melody, s *melody.Session, msg []byte) {

	type WSMessage struct {
		Type string      `json:"type"`
		Data interface{} `json:"data"`
	}

	var wsMsg WSMessage
	if err := json.Unmarshal(msg, &wsMsg); err != nil {
		log.Println("Error unmarshalling message:", err)
		return
	}

	switch wsMsg.Type {
	case "newQuestion":
		var nqData NQDataStruct
		if err := json.Unmarshal(wsMsg.Data.(json.RawMessage), &nqData); err != nil {
			log.Println("Error unmarshalling newQuestion data:", err)
			return
		}
		handleNewQuestion(m, s, nqData)

	case "answer":
		var answer AnswerMsg
		if err := json.Unmarshal(wsMsg.Data.(json.RawMessage), &answer); err != nil {
			log.Println("Error unmarshalling answer data:", err)
			return
		}
		handleAnswer(m, s, answer)
	case "adminAnnouncement":
		var aa AdminAnnouncement
		if err := json.Unmarshal(wsMsg.Data.(json.RawMessage), &aa); err != nil {
			log.Println("Error unmarshalling adminAnnouncement data:", err)
			return
		}
		handleAnnouncement(m, s, aa)

	case "adminHint":
		var ah AdminHint
		if err := json.Unmarshal(wsMsg.Data.(json.RawMessage), &ah); err != nil {
			log.Println("Error unmarshalling adminHint data:", err)
			return
		}
		handleHint(m, s, ah)

	default:
		log.Println("Unknown message type:", wsMsg.Type)
	}
}

var lastQuesionTime = time.Now()

func handleNewQuestion(m melody.Melody, s *melody.Session, nqData NQDataStruct) {
	if nqData.Auth != adminPass {
		log.Println("Unauthorized newQuestion attempt by" + s.Request.RemoteAddr)
		return
	}

	type NewQuestionBroadcast struct {
		Type string   `json:"type"`
		Data Question `json:"data"`
	}

	broadcast := NewQuestionBroadcast{
		Type: "newQuestion",
		Data: nqData.Question,
	}
	jsonBroadcast, err := json.Marshal(broadcast)
	if err != nil {
		log.Println("Error marshalling newQuestion broadcast:", err)
		return
	}
	lastQuesionTime = time.Now()
	m.Broadcast(jsonBroadcast)
}

var Answers []Answer
var answersMutex sync.Mutex

func handleAnswer(m melody.Melody, s *melody.Session, answer AnswerMsg) {
	//check if user exists
	usersMutex.Lock()
	defer usersMutex.Unlock()
	found := false
	for _, u := range Users {
		if u.UserID == answer.UserID {
			found = true
			break
		}
	}
	if !found {
		log.Println("User not found")
		return
	}

	timeLapsed := int(time.Since(lastQuesionTime).Milliseconds())

	//check if already answered
	answersMutex.Lock()
	defer answersMutex.Unlock()
	for _, a := range Answers {
		if a.UserID == answer.UserID {
			log.Println("User already answered")
			return
		}
	}

	//add answer to Answers
	Answers = append(Answers, Answer{
		UserID:     answer.UserID,
		TimeLapsed: timeLapsed,
		OptionIDs:  answer.OptionIDs,
	})

	//log answer
	log.Println("Answer received {QuestionID:", answer.QuestionID, "UserID:", answer.UserID, "TimeLapsed:", timeLapsed, "OptionIDs:", answer.OptionIDs, "}")

}

func handleAnnouncement(m melody.Melody, s *melody.Session, aa AdminAnnouncement) {
	if aa.Auth != adminPass {
		log.Println("Unauthorized adminAnnouncement attempt by" + s.Request.RemoteAddr)
		return
	}

	type AnnouncementBroadcast struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}

	broadcast := AnnouncementBroadcast{
		Type: "announcement",
		Text: aa.Text,
	}
	jsonBroadcast, err := json.Marshal(broadcast)
	if err != nil {
		log.Println("Error marshalling announcement broadcast:", err)
		return
	}
	m.Broadcast(jsonBroadcast)
}

type HintBroadcast struct {
	Type       string `json:"type"`
	QuestionID string `json:"questionID"`
	Text       string `json:"text"`
}

var LatestHintBroadcast HintBroadcast

func handleHint(m melody.Melody, s *melody.Session, ah AdminHint) {
	if ah.Auth != adminPass {
		log.Println("Unauthorized adminHint attempt by" + s.Request.RemoteAddr)
		return
	}

	LatestHintBroadcast = HintBroadcast{
		Type:       "hint",
		QuestionID: ah.QustionID,
		Text:       ah.Text,
	}
	jsonBroadcast, err := json.Marshal(LatestHintBroadcast)
	if err != nil {
		log.Println("Error marshalling hint broadcast:", err)
		return
	}
	m.Broadcast(jsonBroadcast)
}
