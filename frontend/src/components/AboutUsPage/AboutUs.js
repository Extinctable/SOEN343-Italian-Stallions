import React from "react";
import "./AboutUs.css"; 
import Main from "../Header/HeaderMain";


const AboutUs = () => {
  const teamMembers = [
    {
      name: "Massimo Caruso",
      role: "CEO & Full Stack Engineer",
      description: "Massimo is the visionary behind our team. He oversees all of our code, fixes all of our bugs and manages the repository as it were his own child.",
    },
    {
      name: "Abdullah Taha",
      role: "Full Stack Engineer",
      description: "Abdullah is a third year software engineering student with a knack for developing cutting edge technology.",
    },
    {
      name: "Jammie Assenov",
      role: "Frontend Engineer",
      description: "Jammie is a third year software engineering student.",
    },
    {
      name: "Vlad Tita",
      role: "Frontend Engineer",
      description: "Vlad is a third year software engineering student.",
    },
    {
      name: "Alessandro Tiseo",
      role: "Backend Engineer",
      description: "Alessandro is a third year software engineering student who is a beast",
    },
    {
      name: "Gabriel Rodriguez",
      role: "Backend Engineer",
      description: "Gabriel is a third year software engineering student.",
    },
  ];

  return (
    
    <div className="about-us">
       {/* <div className="about-us-header">
        < Main />
      </div>
      */}
      <section className="company-description">
        <h1>About Us</h1>
        <p>
          Our company is dedicated to delivering innovative solutions that solve real-world problems.
          We are passionate about technology and driven by a commitment to excellence and customer satisfaction.
          The system that we created will enable all aspects of event management, offering tailored tools to meet the needs of organizers, participants, and stakeholders.
        </p>
      </section>

      <section className="team-section">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-member">
              <h3>{member.name}</h3>
              <p><strong>{member.role}</strong></p>
              <p>{member.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
