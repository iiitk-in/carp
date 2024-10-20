package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/olahol/melody"
)

type User struct {
	UserID   string `json:"userID"`
	Username string `json:"username"`
}

type Answer struct {
	UserID     string `json:"userID"`
	QuestionID string `json:"questionID"`
	TimeLapsed int    `json:"timeLapsed"`
	OptionIDs  []int  `json:"optionIDs"`
}

type Option struct {
	OptionID int    `json:"optionID"`
	Option   string `json:"option"`
}

type Question struct {
	QuestionID string   `json:"questionID"`
	Question   string   `json:"question"`
	Options    []Option `json:"options"`
}

func main() {
	e := echo.New()
	m := melody.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Static("/", "dist")

	e.GET("/ws", func(c echo.Context) error {
		m.HandleRequest(c.Response().Writer, c.Request())
		return nil
	})

	e.POST("/register", handleRegister)

	m.HandleMessage(func(s *melody.Session, msg []byte) {
		sockHandler(*m, s, msg)
	})

	e.Logger.Fatal(e.Start(":5000"))
}
