package main

import (
	"strings"

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

	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "dist",
		Index:  "index.html",
		HTML5:  true,
		Browse: false,
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/api/")
		},
	}))

	e.GET("/api/ws", func(c echo.Context) error {
		m.HandleRequest(c.Response().Writer, c.Request())
		return nil
	})

	ssessionID := generateID()

	e.GET("/api/session", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"sessionID": ssessionID})
	})

	e.GET("/api/init", handleInit)

	e.POST("/api/register", handleRegister)

	e.POST("/api/leaderboard", handleLeaderboard)

	m.HandleMessage(func(s *melody.Session, msg []byte) {
		sockHandler(*m, s, msg)
	})

	e.Logger.Fatal(e.Start(":5000"))

}
