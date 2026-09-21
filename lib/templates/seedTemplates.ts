import type { ModuleGraph } from "@/types/graph";

export interface ModuleTemplate {
  key: string;
  title: string;
  description: string;
  category: string;
  graph: ModuleGraph;
}

function chain(
  category: string,
  key: string,
  title: string,
  description: string,
  steps: Array<
    | { kind: "input"; label: string; variableName: string; question: string }
    | {
        kind: "prompt";
        label: string;
        systemPrompt: string;
        userPromptTemplate: string;
        outputVariable: string;
      }
    | { kind: "output"; label: string; template: string }
  >,
): ModuleTemplate {
  const nodes = steps.map((step, i) => {
    const id = `n${i + 1}`;
    if (step.kind === "input") {
      return {
        id,
        position: { x: 0, y: i * 160 },
        data: {
          kind: "input" as const,
          label: step.label,
          variableName: step.variableName,
          question: step.question,
          defaultValue: "",
        },
      };
    }
    if (step.kind === "prompt") {
      return {
        id,
        position: { x: 0, y: i * 160 },
        data: {
          kind: "prompt" as const,
          label: step.label,
          provider: "ANTHROPIC" as const,
          model: "claude-sonnet-5",
          systemPrompt: step.systemPrompt,
          userPromptTemplate: step.userPromptTemplate,
          outputVariable: step.outputVariable,
        },
      };
    }
    return {
      id,
      position: { x: 0, y: i * 160 },
      data: {
        kind: "output" as const,
        label: step.label,
        template: step.template,
      },
    };
  });

  const edges = nodes.slice(1).map((node, i) => ({
    id: `e${i + 1}`,
    source: nodes[i].id,
    target: node.id,
  }));

  return { key, title, description, category, graph: { nodes, edges } };
}

export const SEED_TEMPLATES: ModuleTemplate[] = [
  chain(
    "Business Planning",
    "business-plan",
    "Business Plan Builder",
    "Turn a raw idea into a structured business plan: market, model, and go-to-market.",
    [
      { kind: "input", label: "Describe your idea", variableName: "idea", question: "In a few sentences, what's the business idea?" },
      {
        kind: "prompt",
        label: "Market analysis",
        systemPrompt: "You are a sharp startup analyst.",
        userPromptTemplate:
          "Idea: {{idea}}\n\nAnalyze the target market: who the customer is, market size, and 3 competitors.",
        outputVariable: "market",
      },
      {
        kind: "prompt",
        label: "Business model",
        systemPrompt: "You are a startup strategist.",
        userPromptTemplate:
          "Idea: {{idea}}\nMarket analysis: {{market}}\n\nPropose a business model: revenue streams, pricing, and unit economics.",
        outputVariable: "model",
      },
      {
        kind: "prompt",
        label: "Go-to-market plan",
        systemPrompt: "You are a growth marketer.",
        userPromptTemplate:
          "Idea: {{idea}}\nBusiness model: {{model}}\n\nDraft a 90-day go-to-market plan with concrete first steps.",
        outputVariable: "gtm",
      },
      {
        kind: "output",
        label: "Business plan",
        template:
          "# Business Plan\n\n## Idea\n{{idea}}\n\n## Market\n{{market}}\n\n## Business Model\n{{model}}\n\n## Go-to-Market\n{{gtm}}",
      },
    ],
  ),
  chain(
    "Game Design",
    "game-design-doc",
    "Video Game Design Doc",
    "Go from a concept to a structured game design document with mechanics and a level outline.",
    [
      { kind: "input", label: "Describe your game", variableName: "concept", question: "What's the game concept, genre, and vibe?" },
      {
        kind: "prompt",
        label: "Core mechanics",
        systemPrompt: "You are a veteran game designer.",
        userPromptTemplate:
          "Concept: {{concept}}\n\nDefine the core gameplay loop and 3-5 key mechanics.",
        outputVariable: "mechanics",
      },
      {
        kind: "prompt",
        label: "World & characters",
        systemPrompt: "You are a narrative designer.",
        userPromptTemplate:
          "Concept: {{concept}}\nMechanics: {{mechanics}}\n\nOutline the setting and 2-3 main characters.",
        outputVariable: "world",
      },
      {
        kind: "prompt",
        label: "First level outline",
        systemPrompt: "You are a level designer.",
        userPromptTemplate:
          "Mechanics: {{mechanics}}\nWorld: {{world}}\n\nOutline the first playable level, beat by beat.",
        outputVariable: "level",
      },
      {
        kind: "output",
        label: "Design doc",
        template:
          "# Game Design Document\n\n## Concept\n{{concept}}\n\n## Core Mechanics\n{{mechanics}}\n\n## World & Characters\n{{world}}\n\n## Level 1\n{{level}}",
      },
    ],
  ),
  chain(
    "Research",
    "research-project",
    "Research Project Planner",
    "Structure a research question into a literature review angle, methodology, and plan.",
    [
      { kind: "input", label: "Research question", variableName: "question", question: "What's the research question or topic?" },
      {
        kind: "prompt",
        label: "Literature landscape",
        systemPrompt: "You are a research methodologist.",
        userPromptTemplate:
          "Topic: {{question}}\n\nSummarize the likely existing literature landscape and key open debates.",
        outputVariable: "literature",
      },
      {
        kind: "prompt",
        label: "Methodology",
        systemPrompt: "You are a research methodologist.",
        userPromptTemplate:
          "Topic: {{question}}\nLiterature: {{literature}}\n\nPropose a rigorous methodology (design, data, analysis).",
        outputVariable: "methodology",
      },
      {
        kind: "prompt",
        label: "Project plan",
        systemPrompt: "You are a research project manager.",
        userPromptTemplate:
          "Methodology: {{methodology}}\n\nDraft a project timeline with milestones.",
        outputVariable: "plan",
      },
      {
        kind: "output",
        label: "Research plan",
        template:
          "# Research Project Plan\n\n## Question\n{{question}}\n\n## Literature Landscape\n{{literature}}\n\n## Methodology\n{{methodology}}\n\n## Timeline\n{{plan}}",
      },
    ],
  ),
  chain(
    "Book Writing",
    "book-outline",
    "Book Outline Generator",
    "Develop a premise into a full book outline with chapters and arcs.",
    [
      { kind: "input", label: "Book premise", variableName: "premise", question: "What's the book about, and in what genre?" },
      {
        kind: "prompt",
        label: "Premise expansion",
        systemPrompt: "You are a developmental editor.",
        userPromptTemplate:
          "Premise: {{premise}}\n\nExpand this into a one-page pitch: stakes, theme, and hook.",
        outputVariable: "pitch",
      },
      {
        kind: "prompt",
        label: "Character arcs",
        systemPrompt: "You are a developmental editor.",
        userPromptTemplate: "Pitch: {{pitch}}\n\nOutline the main character(s) and their arcs.",
        outputVariable: "characters",
      },
      {
        kind: "prompt",
        label: "Chapter outline",
        systemPrompt: "You are a developmental editor.",
        userPromptTemplate:
          "Pitch: {{pitch}}\nCharacters: {{characters}}\n\nOutline 12-20 chapters with a one-line summary each.",
        outputVariable: "chapters",
      },
      {
        kind: "output",
        label: "Book outline",
        template:
          "# Book Outline\n\n## Pitch\n{{pitch}}\n\n## Characters\n{{characters}}\n\n## Chapters\n{{chapters}}",
      },
    ],
  ),
  chain(
    "Screenwriting",
    "movie-outline",
    "Movie Outline Builder",
    "Turn a logline into a three-act structure and scene-by-scene beat sheet.",
    [
      { kind: "input", label: "Logline", variableName: "logline", question: "What's the one-sentence logline?" },
      {
        kind: "prompt",
        label: "Three-act structure",
        systemPrompt: "You are a screenwriting consultant.",
        userPromptTemplate:
          "Logline: {{logline}}\n\nOutline a three-act structure with the key turning points.",
        outputVariable: "structure",
      },
      {
        kind: "prompt",
        label: "Beat sheet",
        systemPrompt: "You are a screenwriting consultant.",
        userPromptTemplate:
          "Structure: {{structure}}\n\nExpand into a scene-by-scene beat sheet.",
        outputVariable: "beats",
      },
      {
        kind: "output",
        label: "Movie outline",
        template: "# Movie Outline\n\n## Logline\n{{logline}}\n\n## Structure\n{{structure}}\n\n## Beat Sheet\n{{beats}}",
      },
    ],
  ),
  chain(
    "Systems Analysis",
    "system-analysis",
    "System Analysis Framework",
    "Analyze a biological, physical, or organizational system: components, interactions, and failure modes.",
    [
      { kind: "input", label: "Describe the system", variableName: "system", question: "What system are you analyzing?" },
      {
        kind: "prompt",
        label: "Components & boundaries",
        systemPrompt: "You are a systems analyst.",
        userPromptTemplate: "System: {{system}}\n\nIdentify its components, boundaries, and inputs/outputs.",
        outputVariable: "components",
      },
      {
        kind: "prompt",
        label: "Interactions & feedback loops",
        systemPrompt: "You are a systems analyst.",
        userPromptTemplate:
          "Components: {{components}}\n\nMap the key interactions and any feedback loops between them.",
        outputVariable: "interactions",
      },
      {
        kind: "prompt",
        label: "Failure modes",
        systemPrompt: "You are a systems analyst.",
        userPromptTemplate:
          "Interactions: {{interactions}}\n\nIdentify likely failure modes and points of fragility.",
        outputVariable: "failures",
      },
      {
        kind: "output",
        label: "System analysis",
        template:
          "# System Analysis\n\n## Components\n{{components}}\n\n## Interactions\n{{interactions}}\n\n## Failure Modes\n{{failures}}",
      },
    ],
  ),
];
