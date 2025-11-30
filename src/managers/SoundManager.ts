import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

type SoundName = 'bgm' | 'eat' | 'die' | 'click' | 'move';

class SoundManager {
    private sounds: Record<SoundName, AudioPlayer | null> = {
        bgm: null,
        eat: null,
        die: null,
        click: null,
        move: null,
    };

    private soundEnabled: boolean = true;
    private musicEnabled: boolean = true;
    private bgmVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private isLoaded: boolean = false;

    constructor() {
        setAudioModeAsync({
            playsInSilentMode: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        }).catch(console.warn);
    }

    async loadSounds() {
        if (this.isLoaded) return;

        const soundMap: Record<SoundName, any> = {
            bgm: require('../../assets/sounds/bgm.mp3'),
            eat: require('../../assets/sounds/eat.ogg'),
            die: require('../../assets/sounds/die.ogg'),
            click: require('../../assets/sounds/click.ogg'),
            move: require('../../assets/sounds/move.ogg'),
        };

        Object.entries(soundMap).forEach(([name, source]) => {
            try {
                const player = createAudioPlayer(source);
                this.sounds[name as SoundName] = player;
            } catch (e) {
                console.warn(`Failed to create audio player for ${name}:`, e);
            }
        });

        this.isLoaded = true;
    }

    async unloadSounds() {
        Object.values(this.sounds).forEach((player) => {
            if (player) {
                player.remove();
            }
        });
        this.sounds = {
            bgm: null,
            eat: null,
            die: null,
            click: null,
            move: null,
        };
        this.isLoaded = false;
    }

    setSoundEnabled(enabled: boolean) {
        this.soundEnabled = enabled;
    }

    setMusicEnabled(enabled: boolean) {
        this.musicEnabled = enabled;
        if (enabled) {
            this.playBGM();
        } else {
            this.stopBGM();
        }
    }

    setBGMVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.sounds.bgm) {
            this.sounds.bgm.volume = this.bgmVolume;
        }
    }

    setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    playBGM() {
        if (!this.musicEnabled || !this.sounds.bgm) return;
        try {
            const player = this.sounds.bgm;
            player.loop = true;
            player.volume = this.bgmVolume;
            player.play();
        } catch (error) {
            console.warn("Error playing BGM:", error);
        }
    }

    stopBGM() {
        if (!this.sounds.bgm) return;
        try {
            const player = this.sounds.bgm;
            if (player.playing) {
                player.pause();
                player.seekTo(0);
            }
        } catch (error) {
            console.warn("Error stopping BGM:", error);
        }
    }

    playSFX(name: SoundName) {
        if (!this.soundEnabled || !this.sounds[name] || name === 'bgm') return;
        try {
            const player = this.sounds[name]!;
            player.volume = this.sfxVolume;
            player.seekTo(0);
            player.play();
        } catch (error) {
            console.warn(`Error playing SFX ${name}:`, error);
        }
    }
}

export const soundManager = new SoundManager();
