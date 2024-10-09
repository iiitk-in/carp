import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import HeaderSection from "./components/Header";

import { motion, AnimatePresence } from "framer-motion";

import "./App.css";

const routeVariants = {
  initial: {
    y: "100vh",
  },
  final: {
    y: "0vh",
    transition: {
      type: "spring",
      mass: 0.4,
    },
  },
};

const childVariants = {
  initial: {
    opacity: 0,
    y: "50px",
  },
  final: {
    opacity: 1,
    y: "0px",
    transition: {
      duration: 0.5,
      delay: 0.5,
    },
  },
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <HeaderSection />
        <LocationProvider>
          <RoutesWithAnimation />
        </LocationProvider>
      </BrowserRouter>
    </div>
  );
}

function LocationProvider({ children }: { children: React.ReactNode }) {
  return <AnimatePresence>{children}</AnimatePresence>;
}

function RoutesWithAnimation() {
  const location = useLocation();
  console.log(location);

  return (
    <Routes location={location} key={location.key}>
      <Route path="/" element={<Home />} />
      <Route path="/quiz" element={<QuizRoute />} />
    </Routes>
  );
}

function Home() {
  return (
    <motion.div
      variants={routeVariants}
      initial="initial"
      animate="final"
      className="home component"
    >
      <motion.h1 variants={childVariants} initial="initial" animate="final">
        <Login />
      </motion.h1>
    </motion.div>
  );
}

function QuizRoute() {
  return (
    <motion.div
      variants={routeVariants}
      initial="initial"
      animate="final"
      className="quiz component"
    >
      <motion.h1 variants={childVariants} initial="initial" animate="final">
        <Quiz />
      </motion.h1>
    </motion.div>
  );
}

export default App;
