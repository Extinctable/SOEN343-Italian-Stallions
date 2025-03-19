import React from "react"
import './Contact.css'
import Main from "../Header/HeaderMain"
import Swal from 'sweetalert2'

const Contact = () => {

    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
    
        formData.append("access_key", "69a23fc0-3c1b-4f41-9af4-0c8d8e027524");
    
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);
    
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: json
        }).then((res) => res.json());
    
        if (res.success) {
            Swal.fire({
                title: "Success!",
                text: "Message sent successfully!",
                icon: "success"
              });
        }
    }    

    return (
        <section className="contact">
            <div className="header">
                    <Main />
            </div>
            <form className = "form" onSubmit={onSubmit}>
                
                <h2>Contact Form</h2>
                <div className="input-box">
                    <label>Full name</label>
                    <input type="text" className="field" placeholder='Enter your name' name='name' required/>
                </div>
                <div className="input-box">
                    <label>Email Address</label>
                    <input type="email" className="field" placeholder='Enter your email' name='email' required/>
                </div>
                <div className="input-box">
                    <label>Your message</label>
                    <textarea name="message" id="" className="field message" placeholder="Enter your message"></textarea>
                </div>
                <button type="submit">Send Message</button>
            </form>
        </section>
    )
}

export default Contact