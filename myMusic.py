import mido
from mido import MidiFile
import pygame
import time

def display_midi_info(midi_file):
    """Displays MIDI track and message info."""
    print(f"\n🎵 MIDI File: {midi_file.filename}")
    print(f"Tracks: {len(midi_file.tracks)}\n")
    
    for i, track in enumerate(midi_file.tracks):
        print(f"Track {i}: {track.name}")
        for msg in track[:10]:  # Display first 10 messages per track
            print(f"  {msg}")

def play_midi(midi_path):
    """Plays MIDI file using pygame."""
    pygame.init()
    pygame.mixer.init()

    print("\n▶ Playing MIDI...")
    pygame.mixer.music.load(midi_path)
    pygame.mixer.music.play()

    # Wait until the music finishes playing
    while pygame.mixer.music.get_busy():
        time.sleep(0.5)

    print("\n🎵 Playback finished.")

# Load and display MIDI info
midi_path = "original_midi_data\\albeniz\\alb_esp1.mid"  # Change this to your file
midi_file = MidiFile(midi_path)
display_midi_info(midi_file)

# Play the MIDI file
play_midi(midi_path)