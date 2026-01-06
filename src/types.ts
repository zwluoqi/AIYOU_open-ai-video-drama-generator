
export enum NodeType {
  PROMPT_INPUT = 'PROMPT_INPUT',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
  VIDEO_GENERATOR = 'VIDEO_GENERATOR',
  VIDEO_ANALYZER = 'VIDEO_ANALYZER',
  IMAGE_EDITOR = 'IMAGE_EDITOR',
  AUDIO_GENERATOR = 'AUDIO_GENERATOR',
  SCRIPT_PLANNER = 'SCRIPT_PLANNER',
  SCRIPT_EPISODE = 'SCRIPT_EPISODE',
  STORYBOARD_GENERATOR = 'STORYBOARD_GENERATOR',
  CHARACTER_NODE = 'CHARACTER_NODE',
  DRAMA_ANALYZER = 'DRAMA_ANALYZER',
}

export enum NodeStatus {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type VideoGenerationMode = 'DEFAULT' | 'CONTINUE' | 'CUT' | 'FIRST_LAST_FRAME' | 'CHARACTER_REF';

export interface StoryboardShot {
    id: string;
    subject: string;
    scene: string;
    camera: string;
    lighting: string;
    dynamics: string;
    audio: string;
    style: string;
    negative: string;
    imageUrl?: string; // Generated image
    duration?: number;
}

export interface CharacterProfile {
    id: string;
    name: string;
    alias?: string;
    basicStats?: string; // 26岁, 女...
    profession?: string;
    appearance?: string; // Prompt used for generation
    personality?: string;
    motivation?: string;
    values?: string;
    weakness?: string;
    relationships?: string;
    habits?: string;
    interests?: string;
    expressionSheet?: string; // Base64 of 9-grid
    threeViewSheet?: string; // Base64 of 3-view
    rawProfileData?: any; // The full JSON object from LLM
    // Status tracking
    status?: 'IDLE' | 'GENERATING' | 'SUCCESS' | 'ERROR';
    error?: string;
    isSaved?: boolean;
}

export interface DramaAnalysis {
    worldview?: string;
    logic?: string;
    scalability?: string;
    characterTags?: string;
    arc?: string;
    resonance?: string;
    artStyle?: string;
}

export interface AppNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number; // Custom width
  height?: number; // Custom height
  title: string;
  status: NodeStatus;
  data: {
    prompt?: string;
    model?: string; // Selected AI model
    image?: string; // Base64 (The currently displayed main image)
    images?: string[]; // Array of Base64 strings (for multiple generations)
    imageCount?: number; // Number of images to generate (1-4)
    videoCount?: number; // Number of videos to generate (1-4)
    videoUri?: string; // URL
    videoUris?: string[]; // Array of URLs (for multiple video generations)
    videoMetadata?: any; // Stores the raw Video object from Gemini API for extension
    audioUri?: string; // Base64 or Blob URL for Audio Node
    analysis?: string; // Video analysis result
    error?: string;
    progress?: string;
    aspectRatio?: string; // e.g., '16:9', '4:3'
    resolution?: string; // e.g., '1080p', '4k'
    duration?: number; // Duration in seconds (for Audio/Video)
    
    // Script Planner Specifics
    scriptTheme?: string;
    scriptGenre?: string;
    scriptSetting?: string;
    scriptVisualStyle?: 'REAL' | 'ANIME' | '3D'; // New Style Field
    scriptEpisodes?: number; // 5-50
    scriptDuration?: number; // 1-5 mins
    scriptOutline?: string; // The generated text output

    // Script Episode Specifics
    selectedChapter?: string; // The chapter string from outline
    episodeSplitCount?: number; // 1-10
    generatedEpisodes?: { title: string, content: string, characters: string }[]; // Store generated episodes for downstream use

    // Storyboard Generator Specifics
    storyboardCount?: number; // 5-20
    storyboardDuration?: number; // 2-10s
    storyboardStyle?: 'REAL' | 'ANIME' | '3D'; // Style selection
    storyboardShots?: StoryboardShot[];

    // Character Node Specifics
    extractedCharacterNames?: string[]; // List of names found in script
    characterConfigs?: Record<string, {
        method: 'AI_AUTO' | 'AI_CUSTOM' | 'LIBRARY';
        customPrompt?: string;
        libraryId?: string;
    }>;
    generatedCharacters?: CharacterProfile[];

    // Drama Analyzer Specifics
    dramaName?: string;
    dramaAnalysis?: DramaAnalysis;
    dramaAnalysisSelection?: Partial<Record<keyof DramaAnalysis, boolean>>;

    // Video Strategies (StoryContinuator, SceneDirector, FrameWeaver, CharacterRef)
    generationMode?: VideoGenerationMode; 
    selectedFrame?: string; // Base64 of the specific frame captured from video (Raw)
    croppedFrame?: string; // Base64 of the cropped/edited frame (Final Input)
    
    // Input Management
    sortedInputIds?: string[]; // Order of input nodes for multi-image composition
  };
  inputs: string[]; // IDs of nodes this node connects FROM
}

export interface Group {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
}

export interface Connection {
  from: string;
  to: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  id?: string;
}

export interface Workflow {
  id: string;
  title: string;
  thumbnail: string;
  nodes: AppNode[];
  connections: Connection[];
  groups: Group[];
}

// New Smart Sequence Types
export interface SmartSequenceItem {
    id: string;
    src: string; // Base64 or URL
    transition: {
        duration: number; // 1-6s
        prompt: string;
    };
}

// Window interface for Google AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
