import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Header } from "./components/Header.jsx";
import Home from "./pages/Home/index.jsx";
import Quiz from "./pages/Quiz/index.jsx";
import { NotFound } from "./pages/_404.jsx";
import "./style.css";
import AdminPage from "./pages/Admin/index.js";
import Leaderboard from "./pages/Leaderboard/index.js";

export function App() {
  return (
    <LocationProvider>
      <Header />
      <main>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/quiz" component={Quiz} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route default component={NotFound} />
        </Router>
      </main>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
