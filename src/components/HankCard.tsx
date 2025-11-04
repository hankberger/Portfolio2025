import React from "react";
import "./styles/HankCard.css";

export default function HankCard() {
  return (
    <div className="HankCard">
      <div className="title row">
        <img className="sparkle" src="sparkle.svg" />
        <div className="column">
          <h1>HANK BERGER</h1>
          <h2>Frontend Developer</h2>
        </div>
      </div>
      <nav></nav>
    </div>
  );
}
