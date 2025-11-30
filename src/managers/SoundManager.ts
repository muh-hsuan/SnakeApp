import { Audio } from 'expo-av';

type SoundName = 'bgm' | 'eat' | 'die' | 'click' | 'move';

class SoundManager {
    private sounds: Record<SoundName, Audio.Sound | null> = {
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
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
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

        const loadPromises = Object.entries(soundMap).map(async ([name, source]) => {
            const { sound } = await Audio.Sound.createAsync(
                source,
                { shouldPlay: false }
            ).catch(e => {
                console.warn(`Failed to load sound ${name}:`, e);
                return { sound: null };
            });

            if (sound) {
                this.sounds[name as SoundName] = sound;
            }
        });

        await Promise.all(loadPromises);
        this.isLoaded = true;
    }

    async unloadSounds() {
        const unloadPromises = Object.values(this.sounds).map(async (sound) => {
            if (sound) {
                await sound.unloadAsync();
            }
        });
        await Promise.all(unloadPromises);
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
            this.sounds.bgm.setVolumeAsync(this.bgmVolume);
        }
    }

    setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    async playBGM() {
        if (!this.musicEnabled || !this.sounds.bgm) return;
        try {
            const status = await this.sounds.bgm.getStatusAsync();
            if (status.isLoaded && !status.isPlaying) {
                await this.sounds.bgm.setIsLoopingAsync(true);
                await this.sounds.bgm.setVolumeAsync(this.bgmVolume);
                await this.sounds.bgm.playAsync();
            }
        } catch (error) {
            console.warn("Error playing BGM:", error);
        }
    }

    async stopBGM() {
        if (!this.sounds.bgm) return;
        try {
            const status = await this.sounds.bgm.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
                await this.sounds.bgm.stopAsync();
            }
        } catch (error) {
            console.warn("Error stopping BGM:", error);
        }
    }

    async playSFX(name: SoundName) {
        if (!this.soundEnabled || !this.sounds[name] || name === 'bgm') return;
        try {
            await this.sounds[name]?.setVolumeAsync(this.sfxVolume);
            await this.sounds[name]?.replayAsync();
        } catch (error) {
            console.warn(`Error playing SFX ${name}:`, error);
        }
    }
}

export const soundManager = new SoundManager();
