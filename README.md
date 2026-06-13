# Fretted String Music Theory Fretboard Tool

A fretboard learning tool for fretted string instruments, built on 12-tone equal temperament, MIDI absolute pitch, two-dimensional string-fret coordinates, and ordered interval collections.

The first version supports 6/7-string guitars, 4/5-string basses, custom tunings, standalone chord display, diatonic chord display, full scale display, and preset or manually configured Box ranges.

Chinese version: [README-CN.md](README-CN.md)

## Quick Dependency Installation

```bash
cd /Users/apple/Desktop/Character\ String\ Instrument\ Music\ Theory\ Mapping
npm install
```

If `node_modules/` already exists locally, you can usually skip the installation step.

## Quick Usage

```bash
npm run dev
```

After the dev server starts, open the local address shown in the terminal. It is usually:

```text
http://localhost:5173/
```

This is a Vite + React application. During development, use `npm run dev` to open it instead of double-clicking `index.html`.

## Project Structure

|Path|Description|
|---|---|
|`src/`|React + TypeScript application source code|
|`src/domain/`|Core model for note names, intervals, modes, chords, and fretboard mapping|
|`README.md`|Main English project document, including design concept, mathematical theory model, and interval references|
|`README-CN.md`|Original Chinese project document|
|`CONTRIBUTING.md`|Guidelines for bug reports, feature requests, development setup, and pull requests|
|`有品弦乐乐理指板工具.md`|Original design concept notes|
|`指板映射与和弦生成数理模型.md`|Original mathematical model notes|
|`调式音程库.md`|Original mode interval library|
|`和弦音程库.md`|Original chord interval library|

## Development

Node.js `>=22.22.1` and npm `>=10` are required. The project provides an `.nvmrc` file and can be run with a compatible Node.js version.

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run test:coverage
npm run build
```

The coverage gate is enforced by Vitest at 95% statements, branches, functions, and lines for the core domain model.

## Design Concept

The foundation is an ordinary fretted string instrument, such as a 6/7-string guitar or a 4/5-string bass. Moving one fret higher raises the pitch by one semitone. The system also assumes that all notes exist within 12-tone equal temperament, where one octave contains 12 absolute pitch classes with absolute note names.

### 1. Core Design I: Select String Count and Tuning, Then Geometrically Model Music

The tool presets the standard tunings for 6/7-string guitars and 4/5-string basses:

|Instrument|Standard Tuning|
|---|---|
|6-string guitar standard|E2 A2 D3 G3 B3 E4, from lowest string to highest string|
|7-string guitar standard|B1 E2 A2 D3 G3 B3 E4, from lowest string to highest string|
|4-string bass standard|E1 A1 D2 G2, from lowest string to highest string|
|5-string bass standard|B0 E1 A1 D2 G2, from lowest string to highest string|

Non-standard tuning must also be supported. Tuning dynamically determines the interval relationship between strings, which prepares the ground for Core Design II.

Fretboard modeling: the open-string pitch of each string can be positioned as `X`; different strings are then defined as `X1`, `X2`, `X3`, ..., `Xn`. For computational convenience, the lowest string should be treated as `X1`. In the visual display, however, the highest string should be called string 1, so the real-world string number is `n_max - n`.

A note can be defined as `Ym` on a given string. For example, under 6-string guitar standard tuning, if the 6th string is `X1`, then the subset of `X1` is `{Y0, Y1, Y2 ... Y24}`. For any `Y0`, the value is always the tuning pitch of `Xn`. `(X1, Y12)` corresponds to `E3`, which is 12 semitones above the open string.

The relationship of absolute pitch in 12-tone equal temperament also needs to be modeled. The 12-tone system is modeled as groups of 12 notes, assigned as `Zn`. Chords also need to be modeled, where a chord is an ordered collection of interval relationships.

### 2. Core Design II: A Fretboard Pitch Three-Dimensional Model Mediated by Intervals

The basic unit of this three-dimensional model is the semitone in 12-tone equal temperament. It is referred to below as `st`, and the unit is omitted in formulas.

Consecutive strings are named `{Xn}` (`n > 0`, with the lowest string as `X1`). The value of `Xn+1 - Xn` is determined by the tuning. For example, in 6-string guitar standard tuning, `X6 - X5 = 5`, `X5 - X4 = 4`, `X4 - X3 = 5`, `X3 - X2 = 5`, and `X2 - X1 = 5`.

The absolute coordinate value of `X1` uses the MIDI note number as the intermediate computational unit (`1st = 1`). Taking the standard 6-string guitar tuning `E2` as an example, its MIDI number is 40, so `X1 = 40`. From the tuning array, all open-string absolute values can be derived:

$$X_2 = X_1 + 5 = 45$$

$$X_3 = X_2 + 5 = 50$$

Consecutive frets on one string are named `{Ym}` (`m >= 0` and `m <= 24`, with fret 0 represented as 0 and fret m represented as m). On a single string, `Ym+1 - Ym = 1`, meaning that moving by one fret is equivalent to moving by `1st`.

The 12-tone equal-temperament system is modeled through note names using Pitch Class + Octave. A structure similar to `Note(pitch_class, octave)` is used for storage.

Pitch Class has a value range of `[0, 11]` in units of st. Values 0 through 11 are:

|0|1|2|3|4|5|6|7|8|9|10|11|
|---|---|---|---|---|---|---|---|---|---|---|---|
|C|C#/Db|D|D#/Eb|E|F|F#/Gb|G|G#/Ab|A|A#/Bb|B|

Octave represents the octave and is denoted by `p`. For fretted string instruments, `p ∈ Z`, and for real instruments `pmin <= p <= pmax`.

More specifically: `st` is the difference unit, that is, the interval; MIDI Number is the absolute coordinate, that is, the index.

Absolute Pitch calculation: for a note at string `n` and fret `m`, its absolute pitch `S` is:

$$S(n, m) = X_n + m$$

Mapping to `Note(pitch_class, octave)`: once absolute pitch `S` is known, the 12-tone equal-temperament system can be handled as a base-12 cycle, so only division by 12 is needed.

Pitch Class calculation: take the remainder modulo 12 directly.

$$pitch\_class = S \pmod{12}$$

Octave `p` calculation: divide `S` by 12, take the floor, and subtract an offset. In the MIDI standard, middle C4 has number 60, so C0 is 12.

$$p = \lfloor S / 12 \rfloor - 1$$

Because pitch itself has no freedom of movement, this is technically a two-dimensional model, but a three-dimensional model is more cognitively intuitive.

It follows that once the string count and tuning are fixed, every fret has a corresponding absolute pitch. However, absolute pitch alone does not indicate which string or fret it lies on, so absolute pitch should be assigned back onto the string-fret two-dimensional plane. Later, when mapping fretboard notes to diatonic chords, degrees, or in-scale tones through absolute pitch, the system can filter and display matching pitch values within a selected fretboard range, then name them by their fretboard positions.

### 3. Core Design III: Ordered Interval Modeling

A mode is a collection of notes with seven fixed interval relationships; a chord is a collection of multiple fixed interval relationships. After enough chord and interval relationships have been modeled, the seven diatonic chords of a given mode can be derived easily.

All modes and chords are modeled in the form `0 + a + b + c + d + e ...`. The interval sum of a mode should be 12.

To align ordered interval modeling with the exported pitch model from the three-dimensional model, see the "Mathematical Theory Model" section below.

## Mathematical Theory Model

### Fretboard Mapping and Chord Generation: A Formal Mathematical Model

### System Axioms

This model is built on the following axiomatic foundation:

> **Axiom A1 (12-Tone Equal Temperament)** The pitch universe is the integer ring $\mathbb{Z}$, and the difference between adjacent integers is exactly one semitone, or 100 cents. All interval calculations are performed in this discrete linear space.

> **Axiom A2 (Octave Equivalence)** Two pitches that differ by $12k$ where $k \in \mathbb{Z}$ have the same pitch class. The pitch-class space is isomorphic to the residue class ring modulo 12, $\mathbb{Z}_{12}$.

> **Axiom A3 (Physical Linearity)** On standard guitar/bass-type fretted string instruments, the absolute pitch of fret $m$ on a given string equals the open-string pitch plus $m$ semitones. Therefore, there is an integer-linear relationship between fret number and pitch.

> **Notation Convention** In this document, $\mathbb{N}_0 = {0,1,2,\dots}$ and $\mathbb{N}^+ = {1,2,\dots}$. All modulo operations $a \bmod n$ refer to the mathematical non-negative least residue, so the result always belongs to ${0,1,\dots,n-1}$. For an integer $a$ that may be negative, define: $$a \bmod n := ((a \bmod n) + n) \bmod n$$

### I. Fretboard Layer

**Layer responsibility**: establish the basis for mapping physical coordinates to absolute pitch.

#### 1.1 Basic Sets

- **String set**: $\mathcal{N} = {1, 2, \dots, N_s}$, where $N_s \in \mathbb{N}^+$ is the total number of strings.
- **Fret set**: $\mathcal{M} = \mathbb{N}_0$ (theoretically unbounded, but constrained in practice by the physical instrument).
- **Tuning vector**: $\mathbf{X} = (X_1, X_2, \dots, X_{N_s}) \in \mathbb{Z}^{N_s}$, where $X_n$ is the open-string absolute pitch of string $n$.

#### 1.2 Absolute Pitch Mapping Function

$$\text{Pitch}: \mathcal{N} \times \mathcal{M} \to \mathbb{Z}$$

$$\boxed{\text{Pitch}(n, m) = X_n + m}$$

**Property 1.1 (Monotonicity)** For fixed string $n$, $\text{Pitch}(n, \cdot)$ is strictly increasing with respect to $m$.

**Property 1.2 (Inter-String Relationship)** For the same fret $m$, the pitch difference between strings is determined by the tuning vector: $\text{Pitch}(n_1, m) - \text{Pitch}(n_2, m) = X_{n_1} - X_{n_2}$.

### II. Pitch Class Layer

**Layer responsibility**: project absolute pitch into the octave-equivalent abstract structure, removing octave information while preserving interval relationships.

#### 2.1 Projection Function

$$\text{PC}: \mathbb{Z} \to \mathbb{Z}_{12}$$

$$\boxed{\text{PC}(P) = ((P \bmod 12) + 12) \bmod 12}$$

This double modulo operation ensures that for every $P \in \mathbb{Z}$, including negative tuning values, the result always belongs to ${0,1,\dots,11}$.

**Property 2.1 (Octave Invariance)** $\forall k \in \mathbb{Z}$: $\text{PC}(P + 12k) = \text{PC}(P)$.

**Property 2.2 (Additive Homomorphism)** $\text{PC}(P_1 + P_2) = (\text{PC}(P_1) + \text{PC}(P_2)) \bmod 12$.

#### 2.2 Fretboard Pitch-Class Mapping

$$\text{PC}_{n,m} := \text{PC}(\text{Pitch}(n, m)) = \text{PC}(X_n + m)$$

### III. Scale Layer

**Layer responsibility**: define the valid interval-structure space and assign modal context to pitch classes.

#### 3.1 Formal Definition of a Scale Template

**Definition 3.1 (Scale Template)** A scale template $I$ is an integer sequence of length $N$, $I = (I[0], I[1], \dots, I[N-1])$, satisfying the following three axioms:

> **(M1) Root anchoring**: $I[0] = 0$
>
> This condition is a cross-layer prerequisite. The third-stacking formula in Layer V, $k_j = d - 1 + 2j$, assumes that the root is located at the first position of the sequence. When $j=0$ and $d=1$, $k_0=0$ and $Index(0)=0$. If $I[0] \neq 0$, the stacking start point undergoes a systematic semantic shift.
>
> **(M2) Pitch-class uniqueness**: $\forall a \neq b$, $I[a] \not\equiv I[b] \pmod{12}$
>
> **(M3) Size constraint**: $1 \leq N \leq 12$
>
> By the pigeonhole principle, when $N > 12$, (M2) cannot be satisfied, so $\mathcal{I}_{N > 12} = \emptyset$.

All templates satisfying the above conditions form the **scale-template space** $\mathcal{I}$.

#### 3.2 Scale Generation Functions

**Tonal center**: $R \in \mathbb{Z}_{12}$.

**Ordered scale-sequence function (ScaleOrder)**: preserves generation order and returns a 0-indexed ordered tuple.

$$\text{ScaleOrder}(R, I) = \Big(\text{PC}(R + I[0]),\ \text{PC}(R + I[1]),\ \dots,\ \text{PC}(R + I[N-1])\Big)$$

Let $S_k := \text{ScaleOrder}(R,I)[k] = \text{PC}(R + I[k])$, where $k \in {0,\dots,N-1}$.

**Unordered scale-set function (ScaleSet)**:

$$\text{ScaleSet}(R, I) = { \text{PC}(R + I[k]) \mid k = 0, \dots, N-1 }$$

**Proposition 3.1 (Cardinality Preservation)** $|\text{ScaleSet}(R, I)| = N$.

_Proof_: The mapping $f: \mathbb{Z}_{12} \to \mathbb{Z}_{12}$, $f(x) = (R + x) \bmod 12$, is a bijection, that is, an additive permutation. By (M2), $I[k] \bmod 12$ are pairwise distinct; therefore $f(I[k] \bmod 12)$ are also pairwise distinct, and the number of set elements is always $N$. $\blacksquare$

### IV. Degree Layer

**Layer responsibility**: determine the relative position of a pitch class within a specific ordered scale sequence, providing the index basis for chord generation.

#### 4.1 Formalization of the Position Implicit Function

$$\text{Position}(x, S) = \min{k \in {0,\dots,N-1} \mid S[k] = x}$$

This function is **undefined** when $x \notin \text{ScaleSet}(R, I)$, that is, for out-of-scale notes.

#### 4.2 Degree Query Function

$$\text{Degree}_{R,I}: \mathbb{Z}_{12} \rightharpoonup {1, \dots, N}$$

$$\boxed{\text{Degree}_{R,I}(x) = \text{Position}(x,\ \text{ScaleOrder}(R,I)) + 1}$$

This is a **partial function**. The symbol $\rightharpoonup$ indicates that its domain is the subset of in-scale notes. It is naturally undefined for out-of-scale notes, requiring no additional handling.

**Property 4.1** $\text{Degree}_{R,I}(\text{PC}(R)) = 1$, meaning the degree of the root is always 1, consistent with (M1).

### V. Diatonic Chord Layer

**Layer responsibility**: generate the pitch-class sequence and absolute-pitch sequence of third-stacked chords inside a closed mathematical framework, while eliminating semantic ambiguity between parameters.

#### 5.1 Parameter Specification

|Parameter|Type|Constraint|Meaning|
|---|---|---|---|
|$d$|$\mathbb{N}^+$|$d \in {1,\dots,N}$|Diatonic degree of the chord root|
|$r$|$\mathbb{N}^+$|$r \geq 1$|Number of stacked chord tones, for example triad $r=3$, seventh chord $r=4$|
|$R$|$\mathbb{Z}_{12}$|-|Tonal-center pitch class|
|$I$|$\in \mathcal{I}$|$N \leq 12$|Scale template|
|$P_R$|$\mathbb{Z}$|$\text{PC}(P_R) = R$|Absolute-pitch reference for the tonal center, explicitly injected by the caller|

> **Semantic note on $P_R$**: the condition $\text{PC}(P_R) = R$ has infinitely many solutions. The choice of $P_R$ determines the absolute register of the chord and must be uniquely determined by the caller according to voicing needs. **$R$ is derived from $P_R$**, namely $R := \text{PC}(P_R)$, and the two are not independent. Once $P_R$ is determined, $R$ is automatically determined, avoiding parameter drift.

#### 5.2 Computational Core

For $j = 0, 1, \dots, r-1$, define:

$$k_j = d - 1 + 2j \quad \in \mathbb{N}_0$$

$$\text{Index}(j) = k_j \bmod N \quad \in {0,\dots,N-1}$$

$$\text{Oct}(j) = \left\lfloor \frac{k_j}{N} \right\rfloor \quad \in \mathbb{N}_0$$

**Property 5.1 ($k_j$ Monotonicity)** $j < j'\ \Rightarrow\ k_j < k_{j'}$, so $\text{Oct}(j)$ is non-strictly increasing.

#### 5.3 Pitch-Class Chord Sequence

An **ordered tuple** is used instead of a set. This preserves stacking order and prevents congruent elements from collapsing in special templates such as pentatonic scales:

$$\boxed{\text{Chord}_{pc}(d, r, R, I) = \Big(\text{ScaleOrder}(R,I)[\text{Index}(j)]\ \Big|\ j = 0,\dots,r-1\Big)}$$

**Note**: the tuple allows repeated elements when a stacked layer has the same pitch class as an existing layer, faithfully recording the generation process.

#### 5.4 Absolute-Pitch Chord Sequence

$$\boxed{\text{Chord}_{abs}(d, r, P_R, I) = \Big(P_R + I[\text{Index}(j)] + 12 \cdot \text{Oct}(j)\ \Big|\ j = 0,\dots,r-1\Big)}$$

**Proposition 5.2 (Internal Consistency)** Let $R := \text{PC}(P_R)$. Then for every $j$:

$$\text{PC}(\text{Chord}_{abs}[j]) = \text{Chord}_{pc}[j]$$

_Proof_:

$$\text{PC}(P_R + I[\text{Index}(j)] + 12 \cdot \text{Oct}(j))$$

$$= \text{PC}(P_R + I[\text{Index}(j)]) \quad \text{(octave invariance, Property 2.1)}$$

$$= \text{PC}(R + I[\text{Index}(j)]) \quad \text{(because PC}(P_R) = R\text{, by additive homomorphism 2.2)}$$

$$= \text{ScaleOrder}(R,I)[\text{Index}(j)] = \text{Chord}_{pc}[j] \quad \blacksquare$$

This proposition guarantees that $\text{Chord}_{abs}$ and $\text{Chord}_{pc}$ are consistent projections of the same chord object at different layers.

**Property 5.3 (Pitch-Sequence Monotonicity)** The output of $\text{Chord}_{abs}$ is **not guaranteed to be monotonically increasing in pitch**. The output order is the stacking-generation order. If voicing sorted by pitch is required, the caller must sort the result.

### VI. Reverse Mapping Layer

**Layer responsibility**: collapse abstract theoretical results into a finite set of physical coordinates.

#### 6.1 Observation Window Definition

$$\text{Box}(n_1, n_2, m_1, m_2) = {(n, m) \mid n_1 \leq n \leq n_2,\ m_1 \leq m \leq m_2}$$

Here $n_1, n_2 \in \mathcal{N}$, $m_1, m_2 \in \mathcal{M}$, $n_1 \leq n_2$, and $m_1 \leq m_2$. A Box can be configured as a full fretboard or a local window, such as CAGED positions or 3NPS.

#### 6.2 Reverse-Lookup Function Family

**Absolute-pitch reverse lookup**:

$$\text{Coord}_{abs}(P, \text{Box}) = {(n, m) \in \text{Box} \mid \text{Pitch}(n, m) = P}$$

**Pitch-class reverse lookup**:

$$\text{Coord}_{pc}(x, \text{Box}) = {(n, m) \in \text{Box} \mid \text{PC}_{n,m} = x}$$

**In-scale note reverse lookup**:

$$\text{Coord}_{scale}(R, I, \text{Box}) = {(n, m) \in \text{Box} \mid \text{PC}_{n,m} \in \text{ScaleSet}(R, I)}$$

**Whole-chord fretboard-location reverse lookup**:

$$\text{Coord}_{chord}(d, r, P_R, I, \text{Box}) = \bigcup_{P \in \text{Chord}_{abs}(d, r, P_R, I)} \text{Coord}_{abs}(P, \text{Box})$$

> **Truncation-degeneration note**: if $\text{Coord}_{abs}(P, \text{Box}) = \emptyset$, the voice has no physical location inside the current Box. This is normal truncation degeneration; the output is the empty set and is not considered an error. The caller can use this to determine whether a Box configuration fully covers all chord voices.

#### 6.3 Consistency Lemma

**Lemma 6.1** For any $j \in {0,\dots,r-1}$, let $P_j = \text{Chord}_{abs}[j]$ and $x_j = \text{Chord}_{pc}[j]$. Then:

$$\text{Coord}_{abs}(P_j, \text{Box}) \subseteq \text{Coord}_{pc}(x_j, \text{Box})$$

_Proof_: $(n,m) \in \text{Coord}_{abs}(P_j, \text{Box})$ if and only if $\text{Pitch}(n,m) = P_j$. Therefore $\text{PC}_{n,m} = \text{PC}(P_j) = x_j$ by Proposition 5.2, so $(n,m) \in \text{Coord}_{pc}(x_j, \text{Box})$. $\blacksquare$

**Condition for equality**: equality holds when every fret in the Box on a given string that has the same pitch class as $x_j$ corresponds to some octave of $P_j$. In general, $\text{Coord}_{pc}$ contains more cross-octave locations, while $\text{Coord}_{abs}$ is its octave-specific subset.

### VII. Forward Derivation and Physical-Domain Inversion: Formal Commutative Diagram

The following commutative diagram explicitly labels each mapping function, data type, and external-parameter injection node, forming a complete formal closed loop.

```text
┌─────────────────────────────────────────────────────────┐
│        Fretboard Mapping System: Formal Diagram          │
└─────────────────────────────────────────────────────────┘

  ┌──────────────────────┐
  │  Physical Coordinate  │  (n, m) ∈ 𝒩 × ℳ
  │  Coord               │
  └──────────┬───────────┘
             │  Forward sounding
             │  Pitch(n, m) = Xₙ + m
             ▼
  ┌──────────────────────┐
  │  Absolute Pitch       │  P ∈ ℤ
  │  Pitch               │
  └──────────┬───────────┘
             │  Equivalence-class projection
             │  PC(P) = ((P mod 12) + 12) mod 12
             ▼
  ┌──────────────────────┐
  │  Pitch Class          │  x ∈ ℤ₁₂
  │  PC                  │
  └──────────┬───────────┘
             │  Modal interpretation (requires R, I)
             │  Degree_{R,I}(x) = Position(x, ScaleOrder(R,I)) + 1
             ▼
  ┌──────────────────────┐
  │  Diatonic Degree      │  d ∈ {1, …, N}
  │  Degree              │
  └──────────┬───────────┘
             │  Third-stacking and index conversion
             │  kⱼ = d-1+2j, Index(j) = kⱼ mod N, Oct(j) = ⌊kⱼ/N⌋
             ▼
  ┌──────────────────────┐
  │  Abstract Chord       │  (x₀, x₁, …, x_{r-1}) ∈ ℤ₁₂ʳ
  │  Chord_pc tuple       │
  └──────────┬───────────┘
             │
 ════════════╪════════════════════════════════════════
  External    │  P_R ∈ ℤ, satisfying PC(P_R) = R, namely R := PC(P_R)
  injection   │
 ════════════╪════════════════════════════════════════
             │  Octave-compensated anchoring
             │  P_R + I[Index(j)] + 12·Oct(j)
             ▼
  ┌──────────────────────┐
  │  Absolute-Voice Chord │  (P₀, P₁, …, P_{r-1}) ∈ ℤʳ
  │  Chord_abs           │  ─── Proposition 5.2: PC(Pⱼ) = xⱼ ───►
  └──────────┬───────────┘
             │  Physical-domain inversion and Box truncation filter
             │  Coord_abs(P, Box) = {(n,m) ∈ Box | Xₙ+m = P}
             ▼
  ┌──────────────────────┐
  │  Physical Coordinates │  ⊆ 𝒩 × ℳ
  │  Coord set            │
  └──────────────────────┘

  Legend:
  ══ External injection node, the only external degree of freedom in the system
  ── Internal deterministic mapping
  Proposition 5.2 guarantees the consistent projection relationship
  between Chord_abs and Chord_pc
```

### VIII. Core Object Type Table

|Object|Symbol|Type Space|Layer|
|---|---|---|---|
|Physical coordinate|$(n, m)$|$\mathcal{N} \times \mathcal{M}$|I|
|Absolute pitch|$P$|$\mathbb{Z}$|I|
|Pitch class|$x$|$\mathbb{Z}_{12}$|II|
|Scale template|$I$|$\mathcal{I} \subset \mathbb{Z}^N,\ N \leq 12$|III|
|Tonal center|$R$|$\mathbb{Z}_{12}$|III|
|Ordered scale sequence|$\text{ScaleOrder}(R,I)$|$\mathbb{Z}_{12}^N$|III|
|Diatonic degree|$d$|${1,\dots,N}$|IV|
|Pitch-class chord|$\text{Chord}_{pc}$|$\mathbb{Z}_{12}^r$|V|
|Absolute-pitch chord|$\text{Chord}_{abs}$|$\mathbb{Z}^r$|V|
|Observation window|$\text{Box}$|$2^{\mathcal{N} \times \mathcal{M}}$|VI|
|Physical location set|$\text{Coord}_{(\cdot)}$|$2^{\mathcal{N} \times \mathcal{M}}$|VI|

### Appendix A: Key Constraints and Preconditions

|ID|Layer|Constraint|If Violated|
|---|---|---|---|
|C1|II|Double modulo formula prevents negative values|PC returns negative values under down-tuning, causing the pitch-class system to collapse|
|C2|III|$I[0] = 0$ (cross-layer prerequisite)|Root semantics in Layer V stacking shift systematically|
|C3|III|$I[a] \not\equiv I[b] \pmod{12}$, $a \neq b$|ScaleSet cardinality shrinks and Degree mapping is no longer injective|
|C4|III|$N \leq 12$|By the pigeonhole principle, C3 cannot be satisfied and $\mathcal{I} = \emptyset$|
|C5|V|$d \in {1,\dots,N}$|$k_0 < 0$ or octave compensation shifts systematically|
|C6|V|$\text{PC}(P_R) = R$, with $R$ derived from $P_R$|$\text{Chord}_{abs}$ and $\text{Chord}_{pc}$ have inconsistent pitch classes|

### Appendix B: Typical Call Example (C Major Triad in the Natural Major Scale)

**Parameter setup**:

- $I = (0, 2, 4, 5, 7, 9, 11)$ (natural major, $N=7$)
- $R = 0$ (C, where $\text{C}=0$ in $\mathbb{Z}_{12}$)
- $P_R = 48$ (middle-register C, $\text{PC}(48) = 0 = R$ ✓)
- $d = 1$ (starting from the first-degree root)
- $r = 3$ (triad)

**Forward computation**:

$k_0 = 0,\ k_1 = 2,\ k_2 = 4$

$\text{Index}(0) = 0,\ \text{Index}(1) = 2,\ \text{Index}(2) = 4$

$\text{Oct}(0) = 0,\ \text{Oct}(1) = 0,\ \text{Oct}(2) = 0$

$\text{Chord}_{pc} = (\text{PC}(0+0),\ \text{PC}(0+4),\ \text{PC}(0+7)) = (0, 4, 7)$ -> C, E, G ✓

$\text{Chord}_{abs} = (48+0, 48+4, 48+7) = (48, 52, 55)$ -> C, E, G in the middle register ✓

**Verification of Proposition 5.2**: $\text{PC}(48)=0,\ \text{PC}(52)=4,\ \text{PC}(55)=7$ -> fully consistent with $\text{Chord}_{pc}$ ✓

_Model version 4.0 · revised through three rounds of formal review · all constraints complete · cross-layer dependencies explicitly marked_

## Chord and Mode Interval Reference

### Chord Interval Library

|Chord Name|Symbol|Semitone Interval Relationship|
|---|---|---|
|Major|X|0, +4, +3|
|Power|X5|0, +7|
|Minor|Xm|0, +3, +4|
|Augmented|X+|0, +4, +4|
|Diminished|X°|0, +3, +3|
|Suspended 4th|Xsus4|0, +5, +2|
|Suspended 2nd|Xsus2|0, +2, +5|
|Major 7th|Xmaj7|0, +4, +3, +4|
|Minor 7th|Xm7|0, +3, +4, +3|
|Dominant 7th|X7|0, +4, +3, +3|
|Diminished 7th|X°7|0, +3, +3, +3|
|Minor 7th flat 5|Xø7|0, +3, +3, +4|
|Minor Major 7th|Xmmaj7|0, +3, +4, +4|
|Add 9|Xadd9|0, +4, +3, +7|
|Major Add 4|Xadd4|0, +4, +1, +2|
|Minor Add 4|Xmadd4|0, +3, +2, +2|
|Major add 6|X6|0, +4, +3, +2|
|Minor add 6|Xm6|0, +3, +4, +2|
|Dominant 7th sus 4|X7sus4|0, +5, +2, +3|
|Dominant 7th b5|X7b5|0, +4, +2, +4|
|Major 7th sharp 5|Xmaj7#5|0, +4, +4, +3|
|Dominant 7th #5|X7#5|0, +4, +4, +2|
|Major 9th|Xmaj9|0, +4, +3, +4, +3|
|Dominant 9th|X9|0, +4, +3, +3, +4|
|Minor 9th|Xm9|0, +3, +4, +3, +4|
|Major 6+9|X6/9|0, +4, +3, +2, +5|
|Minor 6+9|Xm6/9|0, +3, +4, +2, +5|
|Dominant 7b9|X7b9|0, +4, +3, +3, +3|
|Minor Major 9th|Xmmaj9|0, +3, +4, +4, +3|
|Dominant 7#9|X7#9|0, +4, +3, +3, +5|
|Major 11th|Xmaj11|0, +4, +3, +4, +3, +3|
|Dominant 11th|X11|0, +4, +3, +3, +4, +3|
|Minor 11th|Xm11|0, +3, +4, +3, +4, +3|
|Major 9th sharp 11th|Xmaj9#11|0, +4, +3, +4, +3, +4|
|Major 13th|Xmaj13|0, +4, +3, +4, +3, +3, +4|
|Dominant 13th|X13|0, +4, +3, +3, +4, +3, +4|
|Minor 13th|Xm13|0, +3, +4, +3, +4, +3, +4|
|Major 13th sharp 11|Xmaj13#11|0, +4, +3, +4, +3, +4, +3|

### Mode Interval Library

#### Church Modes

|Mode|Interval Relationship|
|---|---|
|Ionian (Natural Major)|0, +2, +2, +1, +2, +2, +2|
|Dorian|0, +2, +1, +2, +2, +2, +1|
|Phrygian|0, +1, +2, +2, +2, +1, +2|
|Lydian|0, +2, +2, +2, +1, +2, +2|
|Mixolydian|0, +2, +2, +1, +2, +2, +1|
|Aeolian (Natural Minor)|0, +2, +1, +2, +2, +1, +2|
|Locrian|0, +1, +2, +2, +1, +2, +2|

#### Melodic Minor Modes

|Mode|Interval Relationship|
|---|---|
|Melodic Minor I (Melodic Minor)|0, +2, +1, +2, +2, +2, +2|
|Dorian b2|0, +1, +2, +2, +2, +2, +1|
|Lydian Augmented|0, +2, +2, +2, +2, +1, +2|
|Lydian Dominant|0, +2, +2, +2, +1, +2, +1|
|Mixolydian b6|0, +2, +2, +1, +2, +1, +2|
|Locrian #2|0, +2, +1, +2, +1, +2, +2|
|Altered Scale / Super Locrian|0, +1, +2, +1, +2, +2, +2|

#### Harmonic Minor Modes

|Mode|Interval Relationship|
|---|---|
|Harmonic Minor I|0, +2, +1, +2, +2, +1, +3|
|Locrian natural 6|0, +1, +2, +2, +1, +3, +1|
|Ionian #5|0, +2, +2, +1, +3, +1, +2|
|Dorian #4|0, +2, +1, +3, +1, +2, +1|
|Phrygian Dominant|0, +1, +3, +1, +2, +1, +2|
|Lydian #2|0, +3, +1, +2, +1, +2, +2|
|Ultralocrian|0, +1, +2, +1, +2, +2, +1|

#### Pentatonic and Blues Scales

|Mode|Interval Relationship|
|---|---|
|Major Pentatonic|0, +2, +2, +3, +2|
|Minor Pentatonic|0, +3, +2, +2, +3|
|Major Blues|0, +2, +1, +1, +3, +2|
|Minor Blues|0, +3, +2, +1, +1, +3|

#### Symmetric Scales

|Mode|Interval Relationship|
|---|---|
|Whole-Tone Scale|0, +2, +2, +2, +2, +2|
|Diminished Scale / Whole-Half Diminished|0, +2, +1, +2, +1, +2, +1, +2|
|Dominant Diminished / Half-Whole Diminished|0, +1, +2, +1, +2, +1, +2, +1|
|Chromatic Scale|0, +1, +1, +1, +1, +1, +1, +1, +1, +1, +1, +1|

#### World, Exotic, and Microtonal-Style Scales

|Mode|Interval Relationship|
|---|---|
|Gypsy / Hungarian Minor|0, +2, +1, +3, +1, +1, +3|
|Double Harmonic Major|0, +1, +3, +1, +2, +1, +3|
|Persian Scale|0, +1, +3, +1, +1, +2, +3|

#### Harmonic Major Modes

|Mode|Interval Relationship|
|---|---|
|Harmonic Major I|0, +2, +2, +1, +2, +1, +3|
|Dorian b5|0, +2, +1, +2, +1, +3, +1|
|Phrygian b4|0, +1, +2, +1, +3, +1, +2|
|Lydian b3 / Melodic Minor #4|0, +2, +1, +3, +1, +2, +2|
|Mixolydian b2|0, +1, +3, +1, +2, +2, +1|
|Lydian Augmented #2|0, +3, +1, +2, +2, +1, +2|
|Locrian double-flat 7|0, +1, +2, +1, +2, +2, +1|

# Author's Note

The motivation behind this tool came from a simple understanding that emerged while studying chords: a chord is a set of interval relationships. At the same time, a mode can be understood as a fixed collection of seven notes defined by interval relationships, and diatonic chords are formed by taking the 3rd, 5th, 7th, 9th, and related chord tones above each of those seven scale degrees as roots. In other words, the chord tones themselves come first, and the chord name comes afterward. From this perspective, it becomes possible to build a model that quickly derives diatonic chord names through interval relationships, among other functions, and then maps those pitches back onto the fretboard to provide practical guidance. This software is only a minimum viable implementation: it does not yet focus on code quality or broader user experience. Its main purpose is to test the accuracy of the notes derived by the model.
