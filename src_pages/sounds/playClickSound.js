import Sound from 'react-native-sound'

let clickSound;

export const initClickSound = () => {
    clickSound = new Sound('click.wav', Sound.MAIN_BUNDLE, (error) => {
        if(error){
            console.log('LOAD SOUND FAILED : ',error)
            return;
        }
        if(clickSound && clickSound.isLoaded()){
        console.log('Duration of loading Sound: ', clickSound.getDuration());
        }else{
            console.log('Sound loaded, but still initializing...');
        }
    })
}

export const playClickSound = () => {
    if(clickSound){
        clickSound.setVolume(1)
        clickSound.play((success) => {
            if(success){
                console.log('Sound Played')
                console.log('Duration of loading Sound: ', clickSound.getDuration());
                console.log('Volume : ', clickSound.getVolume())
            }else{
                console.log("NOT PLAYED")
            }
        })
    }else{
        console.log('Sound not loaded yet.');
    }
}


export const releaseClickSound = () => {
    if(clickSound){
        clickSound.release();
        clickSound = null;
        console.log('Sound Released');
    }
}