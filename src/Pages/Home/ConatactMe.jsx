import { useState } from "react";

export default function ContactMe() {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        message: '',
        phoneNumber: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 200) {
                alert('Message sent successfully!');
            } else {
                alert('Failed to send message. Please try again later.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    return (
        <section id="Contact" className="contact--section">
            <div>
                <p className="sub--title">Get In Touch</p>
                <h2>Contact Me</h2>
                <p className="text-lg">
                    Feel free to reach out! I'm just a message away. Let's connect and explore possibilities together
                </p>
            </div>
            <form className="contact--form--container" onSubmit={handleSubmit}>
                <div className="container">
                    <label htmlFor="first-name" className="contact--label">
                        <span className="text-md">First Name</span>
                        <input
                            type="text"
                            className="contact--input text-md"
                            name="firstname"
                            id="first-name"
                            required
                            value={formData.firstname}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="last-name" className="contact--label">
                        <span className="text-md">Last Name</span>
                        <input
                            type="text"
                            className="contact--input text-md"
                            name="lastname"
                            id="last-name"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="email" className="contact--label">
                        <span className="text-md">Email</span>
                        <input
                            type="email"
                            className="contact--input text-md"
                            name="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="phone-number" className="contact--label">
                        <span className="text-md">phone-number</span>
                        <input
                            type="number"
                            className="contact--input text-md"
                            name="phoneNumber"
                            id="phone-number"
                            required
                            value={formData.phoneNumber}
                            onChange={handleChange}
                        />
                    </label>
                </div>

                <label htmlFor="message" className="contact--label">
                    <span className="text-md">Message</span>
                    <textarea
                        className="contact--input text-md"
                        id="message"
                        name="message"
                        rows="8"
                        placeholder="Type your message..."
                        value={formData.message}
                        onChange={handleChange}
                    />
                </label>

                <div>
                    <button className="btn btn-primary contact--form--btn">Submit</button>
                </div>
            </form>
        </section>
    );
}