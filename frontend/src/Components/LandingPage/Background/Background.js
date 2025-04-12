import './Background.css'
import concovideo from '../../Assets/landingPage/concovideo.mp4'
import concoimage from '../../Assets/landingPage/concoimage.jpg'
import concoimage2 from '../../Assets/landingPage/concoimage2.jpg'
import concoimage3 from '../../Assets/landingPage/concoimage3.jpg'

const Background = ({playStatus, heroCount}) => {
    
    if (playStatus) {
        return (
            <video className="background fade-in" autoPlay loop muted>
                <source src={concovideo} type="video/mp4" />
            </video>    
        )
    }
    else if(heroCount===0) {

        return <img src ={concoimage} className="background fade-in" alt="" />
    }
    else if(heroCount===1) {
        
        return <img src ={concoimage2} className="background fade-in" alt="" />
    }
    else if(heroCount===2) {
        
        return <img src ={concoimage3} className="background fade-in" alt="" />
    }

}

export default Background