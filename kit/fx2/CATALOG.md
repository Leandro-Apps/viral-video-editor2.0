# Animation catalog (fx2)

Original implementations. Every element is a React component authored on the 1080x1920 canvas, driven only by the current time `t` and the beat window `S..E`. Colours come from the STACK theme (`kit/stack.ts`). `frame` = draws on the whole frame; `box` = the kit fits it into the zone.


## cards3d: 3D cards, proof and logo animations

| id | zone |
|---|---|
| `coverflow` | box |
| `flipProof` | box |
| `sliderProof` | box |
| `tiltCompare` | box |
| `frameworkCards` | box |
| `cardMorph` | box |
| `gridAssemble` | box |
| `depthScatter` | box |
| `constellation` | box |
| `orbitCollapse` | box |
| `logoLockup` | box |
| `avatarCloud` | box |
| `logoChain` | box |


Props:
- `CoverflowProps` { covers?: string[]; n?: number; stop?: number; at?: number; brake?: number; label?: string; y?: number }
- `FlipProofProps` { before: string; after: string; from: number; to: number; label?: string; prefix?: string; suffix?: string; at?: number; y?: number; beforeLabel?: string; afterLabel?: string }
- `SliderProofProps` { before: string; after: string; from: number; to: number; label?: string; prefix?: string; suffix?: string; at?: number; y?: number; fromLabel?: string; toLabel?: string }
- `TiltProps` { variant?: 'judge' | 'split'; left: TiltSide; right: TiltSide; at?: number; title?: string; y?: number }
- `FrameworkProps` { title?: string; y?: number; items: { n?: string; word: string; at: number }[]; placeholder?: string }
- `MorphProps` { from: MorphState; to: MorphState; at: number; dur?: number; cy?: number }
- `GridProps` { title?: string; items: GItem[]; cols?: number; at?: number; stagger?: number; order?: 'random' | 'sequential'; hero?: { i: number; at: number }; proof?: { to: number; prefix?: string; suffix?: string; label?: string }; camera?: 'push' | 'pull'; y?: number }
- `ScatterProps` { items: GItem[]; cols?: number; at?: number; dur?: number; mode?: 'assemble' | 'scatter'; title?: string; y?: number; tileH?: number }
- `ConstellationProps` { slugs: string[]; title?: string; at?: number; cy?: number; rx?: number; ry?: number; speed?: number; size?: number }
- `OrbitCollapseProps` { items: { slug?: string; icon?: string }[]; cta?: string; clickAt: number; cy?: number; rx?: number; ry?: number; title?: string }
- `LockupProps` { tagline?: string; word?: string; at?: number; zoomAt?: number; cy?: number }
- `AvatarCloudProps` { n?: number; hub: { value: number; prefix?: string; suffix?: string; label?: string }; at?: number; cy?: number; rx?: number; ry?: number; title?: string }
- `LogoChainProps` { word?: string; lead?: string; claims?: string[]; claimAt?: number[]; recenterAt?: number; cloudAt?: number; slugs?: string[]; count?: { value: number; suffix?: string; label?: string }; cy?: number }


## data: numbers, charts and living icons

| id | zone |
|---|---|
| `countUp` | box |
| `chartScrub` | box |
| `statFill` | box |
| `pathDraw` | box |
| `livingIcons` | box |
| `heartbeat` | box |
| `retention` | box |
| `funnelReels` | box |
| `spotlight` | box |
| `nudge` | box |
| `sineLoop` | box |
| `teaseRing` | box |


Props:
- `CountUpProps` { from?: number; to: number; prefix?: string; suffix?: string; decimals?: number; label?: string; at?: number; dur?: number; variant?: 'plain' | 'burst'; icons?: string[]; y?: number }
- `ChartScrubProps` { title?: string; data: { d: string; v: number }[]; compare?: number[]; prefix?: string; suffix?: string; scrubAt?: number; scrubDur?: number; y?: number }
- `StatFillProps` { variant?: 'bars' | 'ring' | 'stars'; title?: string; items: { label: string; pct: number; at: number; accent?: boolean }[]; rating?: number; y?: number }
- `PathDrawProps` { variant?: 'flow' | 'arrow'; title?: string; steps: { label: string; icon?: string; at: number }[]; label?: string; at?: number; y?: number }
- `LivingIconsProps` { title?: string; items: { kind: IconKind; label: string; at: number }[]; y?: number }
- `HeartbeatProps` { label?: string; bpm?: number; flatAt: number; payoffAt?: number; cards?: string[]; y?: number }
- `RetentionProps` { title?: string; loops?: [number, number][]; at?: number; dur?: number; withEnd?: number; withoutEnd?: number; withLabel?: string; withoutLabel?: string; y?: number }
- `FunnelReelsProps` { tiers?: string[]; srcs: string[]; pourAt?: number; lightAt?: number; winner?: string; y?: number }
- `SpotlightProps` { target?: number; huntAt?: number; lockAt: number; label?: string; y?: number }
- `NudgeProps` { title?: string; dir?: 'up' | 'left'; items: { text: string; at: number; icon?: string }[]; y?: number }
- `SineLoopProps` { value: string; label?: string; chips?: { text: string; icon?: string }[]; amp?: number; y?: number }
- `TeaseRingProps` { src: string; label?: string; ringAt: number; tickAt?: number; y?: number }


## motionfx: camera moves, glows, presses, particles

| id | zone |
|---|---|
| `cameraJourney` | frame |
| `flight3d` | frame |
| `overwhelm` | frame |
| `themeMorph` | frame |


Props:
- `CameraJourneyProps` { stations: Item[]; variant?: 'pan' | 'zoom'; focusZoom?: number }
- `Flight3dProps` { items: Item[]; depth?: number }
- `OverwhelmProps` { shots: string[]; logos: string[]; you: string; tasks: string[]; densityAt: number; morphAt: number; closeAt: number; youLabel?: string }
- `OutwardProps` { center: Item; items: Item[]; at: number; radius?: number; y?: number }
- `ParticlesProps` { word?: string; slug?: string; at: number; variant?: 'confetti' | 'dots'; count?: number; y?: number; seed?: number }
- `GlitchProps` { word?: string; src?: string; slug?: string; hits: number[]; y?: number; size?: number; dur?: number }
- `StreakProps` { items: { text?: string; slug?: string; at: number; from?: 'left' | 'right'; tone?: 'light' | 'navy' | 'orange' }[]; y?: number; gap?: number }
- `GlowProps` { value?: string; label?: string; slug?: string; at?: number; sweepAt?: number; y?: number }
- `ThemeMorphProps` { anchor?: string; skins: { skin: ThemeSkin; at: number; tag?: string }[]; y?: number }
- `ScaleSwapProps` { cards: (Item & { at: number })[]; y?: number }
- `PressProps` { label: string; mark?: string; morphAt?: number; clickAt: number; y?: number; sub?: string }
- `DisplaceProps` { cards: (Item & { at: number })[]; y?: number }
- `WaterfallProps` { lines: string[]; at: number; accent?: string[]; y?: number; size?: number }
- `ExpandProps` { label: string; rows: { text: string; slug?: string }[]; openAt: number; closeAt?: number; below?: string; y?: number }


## transitions: one `transition` element, many `kind`s

Element: `transition` (frame). Props: `kind`, `tone`, `color`, `dir`, `count`, `amount`, `logo`.

Kinds: flip, cube, blur, blur-dir, blocks, blinds, burn, dip, glitch, chromatic, ripple, vhs, grid, leak, flash, filmburn, shutter, clock, drop, morph, push, elastic, squeeze, iris, diamond, diagonal, zoom, zoomout


## reels: face-window and cut-out compositions

| id | zone |
|---|---|
| `imageCluster` | frame |
| `cutoutGrid` | frame |
| `cutoutBackdrop` | frame |
| `naturalStory` | frame |
| `originStory` | frame |
| `splitFace` | frame |
| `dualRole` | frame |
| `cinematicType` | frame |
| `glassPanel` | frame |
| `tiktokEdit` | frame |
| `personalOpen` | frame |
| `timestamp` | frame |


Props:
- `ImageClusterProps` { images: ClusterImg[]; captionX?: number; captionY?: number }
- `CutoutGridProps` { sets: { at: number; srcs: string[] }[]; hook?: { text: string; sub?: string; until?: number }; cutW?: number }
- `NaturalStoryProps` { moments: StoryMoment[] }
- `OriginStoryProps` { shots: OriginShot[] }
- `SplitFaceProps` { kicker?: string; head: string; core: string; coreAt: number; chips: { text: string; at: number }[] }
- `DualRoleProps` { header: string[]; lines: DualLine[]; sourceName?: string; noviceName?: string }
- `CinematicTypeProps` { windows: CineWindow[]; keys?: string[]; neg?: string }
- `GlassPanelProps` { title?: string; cards: GlassCard[] }
- `TimestampProps` { clips: { at: number; end: number; src: string; day?: number | string; time: string }[] }


## type: kinetic typography and typed UI

| id | zone |
|---|---|
| `kineticBeats` | box |
| `typewriter` | box |
| `decode` | box |
| `gradientSweep` | box |
| `discreteType` | box |
| `anchorCycle` | box |
| `springTicker` | box |
| `tickerTakeover` | box |
| `titleCard` | box |
| `videoText` | box |
| `keywordGlow` | box |
| `marker` | box |
| `cineWords` | - |
| `messaging` | box |


Props:
- `KineticProps` { beats: { text: string; at: number; move?: Move; accent?: boolean }[]; y?: number; size?: number; pill?: boolean }
- `DecodeProps` { text: string; at: number; stagger?: number; dur?: number; y?: number; size?: number; sub?: string; tiles?: boolean }
- `GradientProps` { text: string; at: number; y?: number; size?: number; speed?: number; colors?: [string, string]; sub?: string }
- `DiscreteProps` { states: { t: number; text: string }[]; y?: number; chrome?: 'search' | 'chat' | 'none'; submitAt?: number }
- `AnchorProps` { lead: string; options: string[]; at: number; cycleAt: number; step?: number; accel?: number; final?: string; y?: number; size?: number }
- `TickerProps` { items: string[]; steps: number[]; at: number; lead?: string; y?: number; size?: number }
- `TakeoverProps` { lead: string; options: string[]; at: number; cps?: number; ticks: number[]; heroAt: number; hero?: { text?: string; slug?: string }; y?: number }
- `TitleCardProps` { variant?: 'crossfade' | 'wipe'; title: string; sub?: string; at: number; subAt?: number; eyebrow?: string; slugs?: string[]; y?: number }
- `VideoTextProps` { src?: string; word: string; at: number; statAt: number; wordAt: number; stat?: { value: string; label: string }; pill?: string; y?: number; loopFrames?: number }
- `GlowProps` { words: TWord[]; keywords?: string[]; y?: number; size?: number }
- `MarkerProps` { parts: ({ text: string } | { text: string; mark: Mark; at: number; color?: string })[]; y?: number; size?: number }
- `CineProps` { words: TWord[]; keywords: string[]; negative?: string[]; y?: number; size?: number; keySize?: number }
- `MessagingProps` { phrases: { main: string; accent: string; hold?: number }[]; at: number; cps?: number; y?: number; size?: number }


## ui: product and UI mockups, cursors, chats

| id | zone |
|---|---|



Props:
- `CursorDemoProps` { variant?: 'tour' | 'click' | 'drag' | 'context'; title?: string; y?: number }
- `MultiCursorProps` { names?: [string, string, string]; y?: number }
- `CameraTrackProps` { y?: number }
- `PromptGenerateProps` { prompt?: string; steps?: string[]; y?: number }
- `AgentProgressProps` { agent?: string; steps?: { text: string; n: number; unit: string }[]; receipt?: { title: string; rows: [string, string][] }; y?: number }
- `ChatMockProps` { ask?: string; checks?: string[]; answer?: string; chips?: string[]; y?: number }
- `PanelSyncProps` { headline?: string; y?: number }
- `DeviceShowcaseProps` { shots?: string[]; covers?: string[]; every?: number; y?: number }
- `PhoneFeedProps` { covers?: string[]; side?: [string, string]; handle?: string; y?: number }
- `PageScrollProps` { variant?: '3d' | 'flat'; shots?: string[]; focus?: { shot: number; x: number; y: number; label: string }; y?: number }
- `CommentDmProps` { keyword?: string; offer?: string; thumb?: string; handle?: string; dm?: string; y?: number; tag?: string; showBadge?: boolean }
- `TranscriptRevealProps` { rows?: { kind: 'call' | 'ok' | 'think'; text: string }[]; artifact?: { title: string; rows: [string, string][] }; y?: number }
- `ZoomOutRevealProps` { start?: number; y?: number }
- `TrackingBoxProps` { label?: string; conf?: number; y?: number }
- `ApprovePressProps` { title?: string; steps?: string[]; y?: number }


## around: elements around the presenter head

| id | zone |
|---|---|
| `reelRing` | frame |
| `orbit` | frame |
| `headlineBehind` | box |
| `counterBehind` | box |
| `labelBehind` | box |
| `whip` | frame |
| `shotFan` | box |
| `bigTypeStack` | frame |
| `depthText` | box |
| `dofPull` | frame |
| `proofSlide` | box |
| `igComments` | box |


Props:
- `ReelRingProps` { hook?: { line1: string; line2: string }; covers?: string[]; cy?: number; count?: number }
- `OrbitProps` { items: OrbitItem[]; cy?: number }
- `HeadBehindProps` { line1: string; line2: string; at2?: number; bottom?: number; size2?: number }
- `CounterBehindProps` { from?: number; to: number; prefix?: string; suffix?: string; at?: number; dur?: number; label?: string; bottom?: number; chart?: boolean }
- `LabelBehindProps` { small: string; word: string; n?: number | string; bottom?: number }
- `WhipProps` { covers?: string[]; at?: number; dur?: number; travel?: number; cardW?: number }
- `ShotFanProps` { shots?: string[]; at?: number; step?: number; w?: number; top?: number }
- `DepthTextProps` { text: string; at?: number; layers?: number; dx?: number; dy?: number; bottom?: number; size?: number; color?: string }
- `DofProps` { shots?: string[]; blurAt: number; sharpAt?: number; maxBlur?: number }
- `ProofSlideProps` { cards: ProofSlideCard[] }
- `IgCommentsProps` { items: IgCommentItem[]; top?: number; step?: number; w?: number }


## formats: script-shaped formats (versus, top 5, tier list...)

| id | zone |
|---|---|
| `versus` | box |
| `top5` | box |
| `tierList` | box |
| `ifThen` | box |
| `rapidList` | box |
| `proof` | box |
| `backdrop` | frame |
| `chapter` | box |


Props:
- `VersusProps` { title?: string; y?: number; left: VersusSide; right: VersusSide; at?: number; rightAt?: number; vsAt?: number; winner?: 'left' | 'right'; winnerAt?: number }
- `Top5Props` { title?: string; y?: number; items: { rank: number; text: string; slug?: string; at: number }[] }
- `TierProps` { title?: string; y?: number; tiers?: string[]; items: { tier: string; text: string; slug?: string; at: number }[] }
- `IfThenProps` { title?: string; y?: number; steps: { label: string; text: string; at: number }[] }
- `RapidProps` { title?: string; y?: number; cols?: number; items: { text: string; at: number }[] }
- `ProofProps` { title?: string; y?: number; cards: ProofCard[] }
- `BackdropProps` { word?: string; slug?: string; src?: string; tone?: 'orange' | 'navy' | 'light'; y?: number; frame?: { w: number; h: number } }
- `ChapterProps` { n: number | string; label?: string; title: string; y?: number }
