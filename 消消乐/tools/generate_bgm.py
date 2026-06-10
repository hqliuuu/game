import math
import os
import random
import struct
import wave


SAMPLE_RATE = 44100


def note_freq(note):
    names = {
        "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
        "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
    }
    if len(note) == 2:
        name, octave = note[0], int(note[1])
    else:
        name, octave = note[:2], int(note[2])
    midi = (octave + 1) * 12 + names[name]
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def soft_clip(x):
    return math.tanh(x * 1.25)


def env(t, start, dur, attack=0.03, release=0.35):
    local = t - start
    if local < 0 or local > dur:
        return 0.0
    if local < attack:
        return local / max(attack, 0.001)
    tail = dur - release
    if local > tail:
        return max(0.0, (dur - local) / max(release, 0.001))
    return 1.0


def sine(freq, t):
    return math.sin(2.0 * math.pi * freq * t)


def triangle(freq, t):
    phase = (freq * t) % 1.0
    return 4.0 * abs(phase - 0.5) - 1.0


def bell(freq, local):
    return (
        sine(freq, local) * 0.75
        + sine(freq * 2.01, local) * 0.18
        + sine(freq * 3.01, local) * 0.07
    )


def render_track(path, duration, bpm, progression, melody, mood="menu"):
    random.seed(42)
    total = int(duration * SAMPLE_RATE)
    beat = 60.0 / bpm
    bar = beat * 4
    samples = []

    for i in range(total):
        t = i / SAMPLE_RATE
        bar_index = int(t / bar) % len(progression)
        chord = progression[bar_index]
        bar_start = int(t / bar) * bar
        value = 0.0

        # Warm pad, very quiet and slow, to keep the loop calm.
        for n in chord:
            f = note_freq(n)
            value += sine(f, t) * 0.035
            value += sine(f * 0.5, t) * 0.025

        # Gentle arpeggio with a glassy piano quality.
        arp_step = int((t - bar_start) / (beat * 0.5)) % len(chord)
        arp_note = chord[arp_step]
        arp_start = bar_start + int((t - bar_start) / (beat * 0.5)) * beat * 0.5
        local = t - arp_start
        value += bell(note_freq(arp_note), local) * env(t, arp_start, beat * 1.25, 0.01, 0.55) * 0.12

        # Sparse melody, more present in menu and win cues.
        melody_index = int(t / (beat * 2)) % len(melody)
        mel_note = melody[melody_index]
        mel_start = int(t / (beat * 2)) * beat * 2
        if mel_note:
            local = t - mel_start
            value += bell(note_freq(mel_note), local) * env(t, mel_start, beat * 1.8, 0.02, 0.7) * 0.1

        # Soft pulse instead of tense percussion.
        pulse = math.exp(-((t % beat) / 0.055) ** 2)
        value += pulse * sine(110.0, t) * (0.018 if mood == "gameplay" else 0.012)

        # A small shimmer every two bars.
        shimmer_pos = t % (bar * 2)
        if shimmer_pos < 0.25:
            value += random.uniform(-1.0, 1.0) * (0.006 * (1.0 - shimmer_pos / 0.25))

        samples.append(soft_clip(value) * 0.75)

    write_wav(path, samples)


def render_jingle(path, notes, duration, root_pad):
    total = int(duration * SAMPLE_RATE)
    beat = duration / max(len(notes), 1)
    samples = []
    for i in range(total):
        t = i / SAMPLE_RATE
        value = 0.0
        for n in root_pad:
            value += sine(note_freq(n), t) * 0.035
        index = min(int(t / beat), len(notes) - 1)
        note = notes[index]
        start = index * beat
        if note:
            value += bell(note_freq(note), t - start) * env(t, start, beat * 1.6, 0.015, 0.5) * 0.18
        samples.append(soft_clip(value) * 0.75)
    write_wav(path, samples)


def write_wav(path, samples):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "w") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for s in samples:
            v = int(max(-1.0, min(1.0, s)) * 32767)
            frames.extend(struct.pack("<hh", v, v))
        f.writeframes(bytes(frames))


def main():
    out = os.path.join("public", "assets", "audio", "bgm")
    menu_prog = [
        ["C4", "E4", "G4", "B4"],
        ["A3", "C4", "E4", "G4"],
        ["F3", "A3", "C4", "E4"],
        ["G3", "B3", "D4", "F4"],
    ]
    game_prog = [
        ["D4", "F4", "A4", "C5"],
        ["A3", "C4", "E4", "G4"],
        ["B3", "D4", "F4", "A4"],
        ["G3", "B3", "D4", "F4"],
    ]
    render_track(
        os.path.join(out, "bgm-menu-soft-dossier.wav"),
        72.0,
        76,
        menu_prog,
        ["E5", None, "G5", "D5", "C5", None, "B4", "D5"],
        "menu",
    )
    render_track(
        os.path.join(out, "bgm-gameplay-calm-investigation.wav"),
        96.0,
        82,
        game_prog,
        ["F5", None, "E5", "D5", None, "A4", "C5", None],
        "gameplay",
    )
    render_jingle(
        os.path.join(out, "jingle-level-win-gentle.wav"),
        ["C5", "E5", "G5", "B5", "C6"],
        5.0,
        ["C4", "E4", "G4"],
    )
    render_jingle(
        os.path.join(out, "jingle-level-fail-soft.wav"),
        ["E5", "D5", "B4", "A4"],
        4.0,
        ["A3", "C4", "E4"],
    )


if __name__ == "__main__":
    main()
