/**
 * 角色操作处理服务
 * 使用新的角色生成管理器进行状态管理
 */

import { characterGenerationManager } from './characterGenerationManager';
import { generateCharacterProfile, detectTextInImage } from './geminiService';
import { generateImageWithFallback } from './geminiServiceWithFallback';
import { getUserDefaultModel, getUserPriority } from './modelConfig';
import { AppNode } from '../types';
import { NodeType } from '../types';
import { promptManager } from './promptManager';

/**
 * 处理角色操作
 * @param nodeId 节点ID
 * @param action 操作类型
 * @param charName 角色名称
 * @param node 当前节点
 * @param allNodes 所有节点
 * @param onNodeUpdate 节点更新回调
 * @param customPrompt 可选的自定义提示词（用于重新生成）
 */
export async function handleCharacterAction(
  nodeId: string,
  action: 'DELETE' | 'SAVE' | 'RETRY' | 'GENERATE_EXPRESSION' | 'GENERATE_THREE_VIEW' | 'GENERATE_SINGLE',
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void,
  customPrompt?: { expressionPrompt?: string; threeViewPrompt?: string }
) {
  console.log('[CharacterAction] handleCharacterAction START:', { nodeId, action, charName });

  switch (action) {
    case 'DELETE':
      handleDelete(nodeId, charName, onNodeUpdate);
      break;

    case 'SAVE':
      await handleSave(nodeId, charName, node, allNodes, onNodeUpdate);
      break;

    case 'RETRY':
      await handleRetry(nodeId, charName, node, allNodes, onNodeUpdate);
      break;

    case 'GENERATE_EXPRESSION':
      await handleGenerateExpression(nodeId, charName, node, allNodes, onNodeUpdate, customPrompt?.expressionPrompt);
      break;

    case 'GENERATE_THREE_VIEW':
      await handleGenerateThreeView(nodeId, charName, node, allNodes, onNodeUpdate, customPrompt?.threeViewPrompt);
      break;

    case 'GENERATE_SINGLE':
      await handleGenerateSingle(nodeId, charName, node, allNodes, onNodeUpdate);
      break;
  }

  console.log('[CharacterAction] handleCharacterAction END, calling updateNodeUI');

  // 更新UI
  updateNodeUI(nodeId, onNodeUpdate);

  console.log('[CharacterAction] handleCharacterAction COMPLETE');
}

/**
 * 删除角色
 */
function handleDelete(nodeId: string, charName: string, onNodeUpdate: (nodeId: string, updates: any) => void) {
  console.log('[CharacterAction] handleDelete:', { nodeId, charName });
  characterGenerationManager.deleteCharacter(nodeId, charName);
  updateNodeUI(nodeId, onNodeUpdate);
}

/**
 * 保存角色
 */
async function handleSave(
  nodeId: string,
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void
) {
  console.log('[CharacterAction] handleSave:', { nodeId, charName });

  const state = characterGenerationManager.getCharacterState(nodeId, charName);
  if (!state) {
    console.error('[CharacterAction] Character not found:', charName);
    return;
  }

  // 如果没有三视图，先生成三视图
  if (!state.threeViewSheet) {
    await handleGenerateThreeView(nodeId, charName, node, allNodes, onNodeUpdate);
  }

  // 标记为已保存
  characterGenerationManager.saveCharacter(nodeId, charName);
  updateNodeUI(nodeId, onNodeUpdate);

  // TODO: 保存到资产历史（如果需要）
}

/**
 * 重试生成角色档案（重新生成）
 */
async function handleRetry(
  nodeId: string,
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void
) {
  console.log('[CharacterAction] handleRetry (regenerate profile):', { nodeId, charName });

  // 获取上游上下文
  const context = getUpstreamContext(node, allNodes);
  const stylePrompt = getStylePrompt(node, allNodes);

  try {
    const profile = await characterGenerationManager.generateProfile(
      nodeId,
      charName,
      async () => {
        console.log('[CharacterAction] Calling generateCharacterProfile API for:', charName);
        const result = await generateCharacterProfile(
          charName,
          context,
          stylePrompt,
          undefined,
          getUserDefaultModel('text'),
          { nodeId, nodeType: node.type }
        );
        console.log('[CharacterAction] generateCharacterProfile returned for:', charName, 'hasBasicStats:', !!result?.basicStats);
        return result;
      }
    );

    console.log('[CharacterAction] Profile regenerated successfully:', charName, 'hasBasicStats:', !!profile?.basicStats);
  } catch (error) {
    console.error('[CharacterAction] Profile regeneration failed:', charName, error);
  }

  console.log('[CharacterAction] Calling updateNodeUI after profile regeneration for:', charName);
  updateNodeUI(nodeId, onNodeUpdate);
}

/**
 * 生成表情图
 */
async function handleGenerateExpression(
  nodeId: string,
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void,
  customPrompt?: string
) {
  console.log('[CharacterAction] handleGenerateExpression:', { nodeId, charName, hasCustomPrompt: !!customPrompt });

  let state = characterGenerationManager.getCharacterState(nodeId, charName);

  // 如果管理器中没有这个角色，先初始化
  if (!state) {
    console.log('[CharacterAction] Character state not found, initializing:', charName);
    state = characterGenerationManager.initializeCharacter(nodeId, charName);
  } else {
    console.log('[CharacterAction] Character state exists:', charName, 'profileStatus:', state.profileStatus, 'hasProfile:', !!state.profile);
  }

  // 检查是否有 profile 数据
  if (!state?.profile) {
    alert('角色档案未生成，请先生成角色档案');
    return;
  }

  const stylePrompt = getStylePrompt(node, allNodes);

  try {
    const expressionSheet = await characterGenerationManager.generateExpression(
      nodeId,
      charName,
      async () => {
        // 使用自定义提示词或使用promptManager生成提示词
        let exprPrompt: string;
        let expressionPromptPair: { zh: string; en: string };

        if (customPrompt) {
          exprPrompt = customPrompt;
          expressionPromptPair = {
            zh: customPrompt,
            en: customPrompt
          };
        } else {
          // 使用promptManager生成中英文提示词
          expressionPromptPair = promptManager.buildExpressionPrompt(stylePrompt, state.profile);
          exprPrompt = expressionPromptPair.zh; // 使用中文版本生成
        }

        // 存储提示词到state（通过直接更新内部状态）
        const currentState = characterGenerationManager.getCharacterState(nodeId, charName);
        if (currentState) {
          (currentState as any).expressionPromptZh = expressionPromptPair.zh;
          (currentState as any).expressionPromptEn = expressionPromptPair.en;
        }

        const userPriority = getUserPriority('image');
        const initialModel = userPriority[0] || 'gemini-3-pro-image-preview';

        console.log('[CharacterAction] Generating expression with model:', initialModel);

        const images = await generateImageWithFallback(
          exprPrompt,
          initialModel,
          [],
          { aspectRatio: '1:1', count: 1 },
          { nodeId, nodeType: node.type }
        );

        if (!images || images.length === 0) {
          throw new Error('表情图生成失败：API未返回图片数据');
        }

        return images[0];
      }
    );

    console.log('[CharacterAction] Expression sheet generated successfully:', charName);
  } catch (error) {
    console.error('[CharacterAction] Expression sheet generation failed:', charName, error);
  }

  updateNodeUI(nodeId, onNodeUpdate);
}

/**
 * 生成三视图
 */
async function handleGenerateThreeView(
  nodeId: string,
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void,
  customPrompt?: string
) {
  console.log('[CharacterAction] handleGenerateThreeView:', { nodeId, charName, hasCustomPrompt: !!customPrompt });

  let state = characterGenerationManager.getCharacterState(nodeId, charName);

  // 如果管理器中没有这个角色，先初始化
  if (!state) {
    console.log('[CharacterAction] Character state not found, initializing:', charName);
    state = characterGenerationManager.initializeCharacter(nodeId, charName);
  } else {
    console.log('[CharacterAction] Character state exists:', charName,
      'profileStatus:', state.profileStatus,
      'expressionStatus:', state.expressionStatus,
      'hasProfile:', !!state.profile,
      'hasExpression:', !!state.expressionSheet);
  }

  // 检查是否有 profile 数据
  if (!state?.profile) {
    alert('角色档案未生成，请先生成角色档案');
    return;
  }

  // 检查是否已生成表情图
  if (!state?.expressionSheet) {
    alert('请先生成九宫格表情图，再生成三视图。三视图基于九宫格表情图生成。');
    return;
  }

  const stylePrompt = getStylePrompt(node, allNodes);

  try {
    const threeViewSheet = await characterGenerationManager.generateThreeView(
      nodeId,
      charName,
      async () => {
        // 使用自定义提示词或使用promptManager生成提示词
        let viewPrompt: string;
        let threeViewPromptPair: { zh: string; en: string };

        if (customPrompt) {
          viewPrompt = customPrompt;
          threeViewPromptPair = {
            zh: customPrompt,
            en: customPrompt
          };
        } else {
          // 使用promptManager生成中英文提示词
          threeViewPromptPair = promptManager.buildThreeViewPrompt(stylePrompt, state.profile);
          viewPrompt = threeViewPromptPair.zh; // 使用中文版本生成
        }

        // 存储提示词到state
        const currentState = characterGenerationManager.getCharacterState(nodeId, charName);
        if (currentState) {
          (currentState as any).threeViewPromptZh = threeViewPromptPair.zh;
          (currentState as any).threeViewPromptEn = threeViewPromptPair.en;
        }

        const negativePrompt = "nsfw, text, watermark, label, signature, bad anatomy, deformed, low quality, writing, letters, logo, interface, ui, username, website, chinese characters, info box, stats, descriptions, annotations";

        // 使用九宫格表情作为参考图片
        const inputImages = state.expressionSheet ? [state.expressionSheet] : [];

        let viewImages: string[] = [];
        let hasText = true;
        let attempt = 0;
        const MAX_ATTEMPTS = 3;

        console.log('[CharacterAction] Starting 3-view generation, attempts:', MAX_ATTEMPTS);

        while (hasText && attempt < MAX_ATTEMPTS) {
          if (attempt > 0) {
            const retryPrompt = viewPrompt + " NO TEXT. NO LABELS. CLEAR BACKGROUND.";
            viewImages = await generateImageWithFallback(
              retryPrompt,
              getUserDefaultModel('image'),
              inputImages,
              { aspectRatio: '16:9', resolution: '2K', count: 1 },
              { nodeId, nodeType: node.type }
            );
          } else {
            viewImages = await generateImageWithFallback(
              viewPrompt,
              getUserDefaultModel('image'),
              inputImages,
              { aspectRatio: '16:9', resolution: '2K', count: 1 },
              { nodeId, nodeType: node.type }
            );
          }

          if (viewImages.length > 0) {
            hasText = await detectTextInImage(viewImages[0]);
            if (hasText) {
              console.log(`Text detected in generated 3-view (Attempt ${attempt + 1}/${MAX_ATTEMPTS}). Retrying...`);
            }
          }
          attempt++;
        }

        if (!viewImages || viewImages.length === 0) {
          throw new Error('三视图生成失败：API未返回图片数据');
        }

        return viewImages[0];
      }
    );

    console.log('[CharacterAction] Three-view sheet generated successfully:', charName);
  } catch (error) {
    console.error('[CharacterAction] Three-view sheet generation failed:', charName, error);
    alert(`三视图生成失败：${error}`);
  }

  updateNodeUI(nodeId, onNodeUpdate);
}

/**
 * 生成单个角色（仅生成档案，需要手动点击生成九宫格和三视图）
 */
async function handleGenerateSingle(
  nodeId: string,
  charName: string,
  node: AppNode,
  allNodes: AppNode[],
  onNodeUpdate: (nodeId: string, updates: any) => void
) {
  console.log('[CharacterAction] handleGenerateSingle:', { nodeId, charName });

  try {
    // 仅生成档案，不自动生成表情和三视图
    await handleRetry(nodeId, charName, node, allNodes, onNodeUpdate);

    console.log('[CharacterAction] Character profile generated:', charName);
  } catch (error) {
    console.error('[CharacterAction] Character profile generation failed:', charName, error);
  }
}

/**
 * 更新节点UI
 * 关键：只更新已生成角色的状态，未生成的角色不存储在 generatedCharacters 中
 */
function updateNodeUI(
  nodeId: string,
  onNodeUpdate: (nodeId: string, updates: any) => void,
  allNames?: string[]  // 不再使用，保留参数避免破坏现有调用
) {
  // 从管理器获取已生成的角色（只返回真正生成过的）
  const generatedCharacters = characterGenerationManager.getCharactersForNode(nodeId);

  console.log('[updateNodeUI] Updating node:', nodeId, 'generatedCount:', generatedCharacters.length,
    'characters:', generatedCharacters.map(c => ({ name: c.name, status: c.status })));

  // 只更新已生成角色的状态，未生成的角色不放入 generatedCharacters
  onNodeUpdate(nodeId, { generatedCharacters: generatedCharacters });
}

/**
 * 获取上游上下文
 */
function getUpstreamContext(node: AppNode, allNodes: AppNode[]): string {
  const inputs = node.inputs.map(i => allNodes.find(n => n.id === i)).filter(Boolean) as AppNode[];
  const upstreamTexts = inputs.map(n => {
    if (n?.type === NodeType.PROMPT_INPUT) return n.data.prompt;
    if (n?.type === NodeType.VIDEO_ANALYZER) return n.data.analysis;
    if (n?.type === NodeType.SCRIPT_EPISODE && n.data.generatedEpisodes) {
      return n.data.generatedEpisodes.map(ep => `${ep.title}\n角色: ${ep.characters}`).join('\n');
    }
    if (n?.type === NodeType.SCRIPT_PLANNER) return n.data.scriptOutline;
    return null;
  }).filter(t => t && t.trim().length > 0) as string[];

  return upstreamTexts.join('\n');
}

/**
 * 获取风格提示词
 */
function getStylePrompt(node: AppNode, allNodes: AppNode[]): string {
  const inputs = node.inputs.map(i => allNodes.find(n => n.id === i)).filter(Boolean) as AppNode[];
  const stylePresetNode = inputs.find(n => n.type === NodeType.STYLE_PRESET);

  if (stylePresetNode?.data.stylePrompt) {
    return stylePresetNode.data.stylePrompt;
  }

  // Fallback to upstream context
  const { style, genre, setting } = getUpstreamStyleContextFromNode(node, allNodes);
  return getVisualPromptPrefix(style, genre, setting);
}

function getUpstreamStyleContextFromNode(node: AppNode, allNodes: AppNode[]): { style: string; genre: string; setting: string } {
  // 简化的实现，可以从原代码中提取
  return { style: '3D', genre: '', setting: '' };
}

function getVisualPromptPrefix(style: string, genre: string, setting: string): string {
  // 仙侠3D风格 - 半写实唯美风格
  return `Xianxia 3D animation character, semi-realistic style, Xianxia animation aesthetics, high precision 3D modeling, PBR shading with soft translucency, subsurface scattering, ambient occlusion, delicate and smooth skin texture (not overly realistic), flowing fabric clothing, individual hair strands, soft ethereal lighting, cinematic rim lighting with cool blue tones, otherworldly gaze, elegant and cold demeanor`;
}

/**
 * 构建负面提示词
 */
function buildNegativePrompt(node: AppNode, allNodes: AppNode[]): string {
  let negative = "nsfw, text, watermark, label, signature, bad anatomy, deformed, low quality, writing, letters, logo, interface, ui";

  const { style: detectedStyle } = getUpstreamStyleContextFromNode(node, allNodes);
  if (detectedStyle === 'REAL') {
    negative += ", anime, 3d render, cgi, 3d animation, illustrated, painting, drawing";
  } else if (detectedStyle === 'ANIME') {
    negative += ", photorealistic, realistic, photo, 3d, cgi, live action";
  } else if (detectedStyle === '3D') {
    // 3D类型：明确排除2D风格，保留3D质感，避免过度写实
    negative += ", 2D illustration, hand-drawn, anime 2D, flat shading, cel shading, toon shading, cartoon 2D, paper cutout, overly photorealistic, hyper-realistic skin, photorealistic rendering";
  }

  negative += ", full body, standing, legs, feet, full-length portrait, wide shot, environmental background, patterned background, gradient background";

  return negative;
}
