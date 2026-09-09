# CAGED Scale-Degree Training Design

## Goal

Add a movable-do practice area that mirrors how a guitarist establishes a key on the neck: choose a key, find a root anchor, recall a CAGED form, and react to scale degrees inside that form.

## Initial Scope

- Major scale only.
- C and G CAGED forms.
- All twelve sharp-spelled tonic choices, with `1 = E` as the default.
- Manual setup or automatic questions that choose both tonic and C/G form.
- Four harmonic layers built from one seven-note shape:
  - Root: `1`
  - Major triad: `1, 3, 5`
  - Major pentatonic: `1, 2, 3, 5, 6`
  - Full major scale: `1, 2, 3, 4, 5, 6, 7`
- Local shape view instead of squeezing the whole 0–12 fretboard into the primary exercise.

## CAGED Placement

Each movable form is represented by the four-fret region ending at its low root anchor:

- C form: fifth-string root anchor.
- G form: sixth-string root anchor.

For `1 = E`, this places the C form at frets 4–7 and the G form at frets 9–12. The app calculates the note and scale degree at every included position, so the same form transposes to other tonic choices.

## Practice Modes

### Build Shape

1. Show the selected key, form, and harmonic layer.
2. Ask the player to locate any root inside the form.
3. Keep the chosen root as an anchor.
4. Ask the player to select every position belonging to the chosen layer.
5. On submit, show correct selections, wrong selections, and missed positions. Reveal scale-degree numbers during review.

### Identify Degree

- Highlight a scale position inside the selected form and layer.
- Ask for its scale degree using four choices.
- Feedback connects relative and fixed-pitch knowledge, for example `6 = C#` in E major.
- Correct answers advance automatically; wrong answers reveal the answer and wait for Next.

### Locate Degree

- Show a target scale degree and its fixed note name.
- Ask the player to select every matching position inside the current form.
- Reuse the existing correct, wrong, and missed-position feedback.

### Melody Path

- Randomly select one of sixteen short scale-degree melodies.
- Melodies contain changes of direction instead of being limited to straight ascending or descending scales.
- Map the same relative melody into the selected key and C/G form.
- Ask the player to find a root before revealing the melody. Use the chosen root as middle `1`, select a melody that fits its available register, then require the remaining path in order.
- Use an undotted number for the starting octave, a dot above for the higher octave, and a dot below for the lower octave.
- Count wrong taps without advancing the melody, and report whether the path was completed without mistakes.

## Product Structure

The app separates two dimensions:

- Training content: fixed note names or movable scale degrees.
- Interaction: build a form, identify a highlighted position, or locate a target.

The fixed-note trainer retains its existing difficulty rules. Scale-degree training instead uses independent tonic, CAGED form, and harmonic-layer controls.

## Future Work

- Per-form and per-degree mastery statistics.
- Add A form before presenting C-to-G movement as a continuous adjacent-position exercise.
- Key-aware flat spelling.
- Other CAGED forms, minor scales, and user-selectable fingering systems.
