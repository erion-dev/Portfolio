import image from '../../img/React.js .png'

export default function AboutMe() {
    return (
        <section id="AboutMe" className="about--section">
            <div className="about--section--img">
                <img src={image} alt="About Me" />
            </div>
            <div className="hero--section--content--box about--section--box">
                <div className="hero--section--content">

                    <h1 className="skills-section--heading">About Me</h1>
                    <p className="hero--section-description">
                        I'm a front-end developer with a relentless pursuit of pixel-perfection and user delight.
                        Transforming creative concepts into interactive web experiences is my passion.
                        I'm well-versed in HTML, CSS, JavaScript, and cutting-edge technologies,
                        making me your go-to expert for crafting visually stunning and functionally seamless websites.
                        Let's bring your digital vision to life!
                    </p>
                    <p className="hero--section-description">
                        Are you currently seeking a skilled React developer to bring your web projects to
                        life and enhance user experiences?
                    </p>
                </div>
            </div>
        </section>
    );
}