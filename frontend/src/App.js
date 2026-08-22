import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import WorkShowcase from "@/components/WorkShowcase";
import About from "@/components/About";
import SubscribePlaceholder from "@/components/SubscribePlaceholder";
import Footer from "@/components/Footer";
import HeartCounter from "@/components/HeartCounter";
import { HOME } from "@/constants/testIds";

const Home = () => {
    return (
        <div data-testid={HOME.root} className="relative">
            <Nav />
            <main>
                <Hero />
                <WorkShowcase />
                <About />
                <SubscribePlaceholder />
            </main>
            <Footer />
            <HeartCounter />
        </div>
    );
};

function App() {
    return (
        <div className="App">
            {/* PUBLIC_URL comes from "homepage" in package.json, so the same
                build works whether this is served at the domain root or under
                a path like /design on secondlifesoftware.com. */}
            <BrowserRouter basename={process.env.PUBLIC_URL || "/"}>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
