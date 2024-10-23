package main

import (
	"encoding/json"
	"log"
	"os"
	"regexp"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/olahol/melody"
)

var Users []User
var usersMutex sync.Mutex

// read password from args
var adminPass = func() string {
	if len(os.Args) > 1 {
		return os.Args[1]
	} else {
		panic("No password provided")
	}
}()

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
	log.Println("User registered:", user)

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

type AdminAnswerkey struct {
	Auth       string `json:"auth"`
	QuestionId string `json:"questionID"`
	OptionIDs  []int  `json:"answerKey"`
}

func sockHandler(m melody.Melody, s *melody.Session, msg []byte) {

	if string(msg) == "ping" {
		s.Write([]byte("pong"))
		return
	}

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
		data, ok := wsMsg.Data.(map[string]interface{})
		if !ok {
			log.Println("Error: wsMsg.Data is not of type map[string]interface{}")
			return
		}
		rawData, err := json.Marshal(data)
		if err != nil {
			log.Println("Error marshalling wsMsg.Data:", err)
			return
		}
		if err := json.Unmarshal(rawData, &nqData); err != nil {
			log.Println("Error unmarshalling newQuestion data:", err)
			return
		}
		handleNewQuestion(m, s, nqData)
	case "answer":
		var answer AnswerMsg
		data, ok := wsMsg.Data.(map[string]interface{})
		if !ok {
			log.Println("Error: wsMsg.Data is not of type map[string]interface{}")
			return
		}
		rawData, err := json.Marshal(data)
		if err != nil {
			log.Println("Error marshalling wsMsg.Data:", err)
			return
		}
		if err := json.Unmarshal(rawData, &answer); err != nil {
			log.Println("Error unmarshalling answer data:", err)
			return
		}
		handleAnswer(m, s, answer)

	case "adminAnnouncement":
		var aa AdminAnnouncement
		data, ok := wsMsg.Data.(map[string]interface{})
		if !ok {
			log.Println("Error: wsMsg.Data is not of type map[string]interface{}")
			return
		}
		rawData, err := json.Marshal(data)
		if err != nil {
			log.Println("Error marshalling wsMsg.Data:", err)
			return
		}
		if err := json.Unmarshal(rawData, &aa); err != nil {
			log.Println("Error unmarshalling adminAnnouncement data:", err)
			return
		}
		handleAnnouncement(m, s, aa)

	case "adminHint":
		var ah AdminHint
		data, ok := wsMsg.Data.(map[string]interface{})
		if !ok {
			log.Println("Error: wsMsg.Data is not of type map[string]interface{}")
			return
		}
		rawData, err := json.Marshal(data)
		if err != nil {
			log.Println("Error marshalling wsMsg.Data:", err)
			return
		}
		if err := json.Unmarshal(rawData, &ah); err != nil {
			log.Println("Error unmarshalling adminHint data:", err)
			return
		}
		handleHint(m, s, ah)

	case "adminAnswerkey":
		var aa AdminAnswerkey
		data, ok := wsMsg.Data.(map[string]interface{})
		if !ok {
			log.Println("Error: wsMsg.Data is not of type map[string]interface{}")
			return
		}
		rawData, err := json.Marshal(data)
		if err != nil {
			log.Println("Error marshalling wsMsg.Data:", err)
			return
		}
		if err := json.Unmarshal(rawData, &aa); err != nil {
			log.Println("Error unmarshalling adminAnswerkey data:", err)
			return
		}
		handleAnswerkey(m, s, aa)

	default:
		log.Println("Unknown message type:", wsMsg.Type)
	}
}

var lastQuesionTime = time.Now()
var LatestAnnouncementBroadcast *AnnouncementBroadcast

type NewQuestionBroadcast struct {
	Type string   `json:"type"`
	Data Question `json:"data"`
}

var LatestQuestionBroadcast *NewQuestionBroadcast

type AnswerkeyBroadcast struct {
	Type string        `json:"type"`
	Data AnswerKeyData `json:"data"`
}

var LatestAnswerkeyBroadcast *AnswerkeyBroadcast

type HintBroadcast struct {
	Type string   `json:"type"`
	Data HintData `json:"data"`
}

var LatestHintBroadcast *HintBroadcast

func handleNewQuestion(m melody.Melody, s *melody.Session, nqData NQDataStruct) {
	if nqData.Auth != adminPass {
		log.Println("Unauthorized newQuestion attempt by" + s.Request.RemoteAddr)
		return
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
	LatestQuestionBroadcast = &broadcast
	LatestAnswerkeyBroadcast = nil
	LatestHintBroadcast = nil
	LatestAnnouncementBroadcast = nil
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
		QuestionID: answer.QuestionID,
		TimeLapsed: timeLapsed,
		OptionIDs:  answer.OptionIDs,
	})

	//log answer
	log.Println("Answer received {QuestionID:", answer.QuestionID, "UserID:", answer.UserID, "TimeLapsed:", timeLapsed, "OptionIDs:", answer.OptionIDs, "}")

}

type AnnouncementBroadcast struct {
	Type string `json:"type"`
	Data struct {
		Text string `json:"text"`
	} `json:"data"`
}

func handleAnnouncement(m melody.Melody, s *melody.Session, aa AdminAnnouncement) {
	if aa.Auth != adminPass {
		log.Println("Unauthorized adminAnnouncement attempt by" + s.Request.RemoteAddr)
		return
	}

	broadcast := AnnouncementBroadcast{
		Type: "announcement",
		Data: struct {
			Text string `json:"text"`
		}{
			Text: aa.Text,
		},
	}
	jsonBroadcast, err := json.Marshal(broadcast)
	if err != nil {
		log.Println("Error marshalling announcement broadcast:", err)
		return
	}
	LatestAnnouncementBroadcast = &broadcast
	LatestQuestionBroadcast = nil
	LatestAnswerkeyBroadcast = nil
	LatestHintBroadcast = nil
	m.Broadcast(jsonBroadcast)
}

type HintData struct {
	QuestionID string `json:"questionID"`
	Text       string `json:"text"`
}

func handleHint(m melody.Melody, s *melody.Session, ah AdminHint) {
	if ah.Auth != adminPass {
		log.Println("Unauthorized adminHint attempt by" + s.Request.RemoteAddr)
		return
	}

	LatestHintBroadcast = &HintBroadcast{
		Type: "hint",
		Data: HintData{
			QuestionID: ah.QustionID,
			Text:       ah.Text,
		},
	}
	jsonBroadcast, err := json.Marshal(LatestHintBroadcast)
	if err != nil {
		log.Println("Error marshalling hint broadcast:", err)
		return
	}
	m.Broadcast(jsonBroadcast)
}

type AnswerKeyData struct {
	QuestionID string `json:"questionID"`
	OptionIDs  []int  `json:"optionIDs"`
}

func handleAnswerkey(m melody.Melody, s *melody.Session, aa AdminAnswerkey) {
	if aa.Auth != adminPass {
		log.Println("Unauthorized adminAnswerkey attempt by" + s.Request.RemoteAddr)
		return
	}

	LatestAnswerkeyBroadcast = &AnswerkeyBroadcast{
		Type: "answerkey",
		Data: AnswerKeyData{
			QuestionID: aa.QuestionId,
			OptionIDs:  aa.OptionIDs,
		},
	}

	jsonBroadcast, err := json.Marshal(LatestAnswerkeyBroadcast)
	if err != nil {
		log.Println("Error marshalling answerkey broadcast:", err)
		return
	}
	m.Broadcast(jsonBroadcast)
}

func handleLeaderboard(c echo.Context) error {
	//check password json body
	type Password struct {
		Auth string `json:"auth"`
	}
	req := new(Password)
	if err := c.Bind(req); err != nil {
		return c.String(400, "Bad Request")
	}
	if req.Auth != adminPass {
		return c.String(401, "Unauthorized")
	}

	type LeaderboardEntry struct {
		UserID   string `json:"userID"`
		Username string `json:"username"`
		Time     int    `json:"time"`
	}

	// Lock the mutex before accessing Answers to ensure safe concurrent access
	answersMutex.Lock()
	defer answersMutex.Unlock()
	//if no answers return empty array
	if len(Answers) == 0 {
		log.Println("No answers")
		return c.JSON(200, []LeaderboardEntry{})
	}
	// if no answerkey return empty array
	if LatestAnswerkeyBroadcast == nil {
		log.Println("No answerkey")
		return c.JSON(200, []LeaderboardEntry{})
	}

	//Create a slice of LeaderboardEntry with questionID = LatestAnswerkeyBroadcast.QuestionID and all correct answers
	leaderboard := make([]LeaderboardEntry, 0)
	for _, a := range Answers {
		log.Println(a)
		if a.QuestionID == LatestAnswerkeyBroadcast.Data.QuestionID {
			//directly skip if optionIDs length is not equal to answerKey length
			if len(a.OptionIDs) != len(LatestAnswerkeyBroadcast.Data.OptionIDs) {
				continue
			}
			correct := true
			//compare unsorted arrays
			for i, v := range a.OptionIDs {
				if v != LatestAnswerkeyBroadcast.Data.OptionIDs[i] {
					correct = false
					break
				}
			}

			if correct {
				leaderboard = append(leaderboard, LeaderboardEntry{
					UserID: a.UserID,
					Username: func() string {
						usersMutex.Lock()
						defer usersMutex.Unlock()
						for _, u := range Users {
							if u.UserID == a.UserID {
								return u.Username
							}
						}
						return ""
					}(),
					Time: a.TimeLapsed,
				})
			}
		}
	}

	return c.JSON(200, leaderboard)
}

// Send current state to new user
func handleInit(c echo.Context) error {
	type InitData struct {
		LastAnnouncement *AnnouncementBroadcast `json:"lastAnnouncement"`
		LastQuestion     *Question              `json:"lastQuestion"`
		LastHint         *HintBroadcast         `json:"lastHint"`
		LastAnswerkey    *AnswerkeyBroadcast    `json:"lastAnswerkey"`
	}

	initData := InitData{
		LastAnnouncement: func() *AnnouncementBroadcast {
			if LatestAnnouncementBroadcast != nil {
				return LatestAnnouncementBroadcast
			}
			return nil
		}(),
		LastQuestion: func() *Question {
			if LatestQuestionBroadcast != nil {
				return &LatestQuestionBroadcast.Data
			}
			return nil
		}(),
		LastHint: func() *HintBroadcast {
			if LatestHintBroadcast != nil {
				return LatestHintBroadcast
			}
			return nil
		}(),
		LastAnswerkey: func() *AnswerkeyBroadcast {
			if LatestAnswerkeyBroadcast != nil {
				return LatestAnswerkeyBroadcast
			}
			return nil
		}(),
	}

	return c.JSON(200, initData)
}
