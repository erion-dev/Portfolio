import image from '../../img/myimage.jpeg'

export default function HeroSection() {
    return (
        <section id="heroSection" className="hero--section">
            <div className="hero--section--content--box">
                <div className="hero--section--content">
                    <p className="section--title">Hey, I'm Erion Haxhikadrija</p>
                    <h1 className="hero--section--title">
                        <span className="hero--section-title--color">React</span>{" "}
                        <br />
                        Developer
                    </h1>
                    <p className="hero--section-description">

                        I'm a passionate React developer dedicated to crafting exceptional
                        user experiences with cutting-edge web applications.
                        <br />  🚀💻 #ReactDeveloper #PassionateAboutCode
                    </p>
                </div>
                <button className="btn btn-primary">Get In Touch</button>
            </div>
            <div className="hero--section--img">
                <img src={image} alt="Hero Section" />
            </div>
        </section>
    );
}