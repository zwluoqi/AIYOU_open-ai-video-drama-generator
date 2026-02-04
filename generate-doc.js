import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, UnderlineType } from 'docx';
import fs from 'fs';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // 标题
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: 'AIYOU 漫剧创作平台',
            bold: true,
            size: 48,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [
          new TextRun({
            text: '新手入门指南',
            bold: true,
            size: 32,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 目录
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: '目 录',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '一、关于 AIYOU ..................................................... 2',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '二、快速开始（3 步搞定） .................................... 3',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '三、配置 API Key .................................................... 4',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '四、创作流程 ....................................................... 5',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '五、常见问题 ....................................................... 6',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '六、注意事项 ....................................................... 7',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 第一章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '一、关于 AIYOU',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "AIYOU 是一款 AI 驱动的漫剧创作平台，一个人就是一支团队。通过简单的节点式操作，就能完成从创意到视频的全流程创作。",
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '【核心亮点】',
            bold: true,
            size: 24,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 36 天纯 AI 开发，一行代码没写过',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 12 个智能节点，覆盖剧本→角色→分镜→视频全流程',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 成本低至 3 元/分钟，专业级效果',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 免费开源，两天后正式开源',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 第二章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '二、快速开始（3 步搞定）',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '使用 Trae IDE，最快 3 步即可开始创作。',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 步骤 1
      new Paragraph({
        spacing: { before: 200, after: 150 },
        children: [
          new TextRun({
            text: '【第一步】克隆项目',
            bold: true,
            size: 24,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '在 Trae IDE 中打开终端，执行：',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'git clone https://github.com/你的用户名/aiyou.git',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),

      // 步骤 2
      new Paragraph({
        spacing: { before: 200, after: 150 },
        children: [
          new TextRun({
            text: '【第二步】安装依赖',
            bold: true,
            size: 24,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'cd aiyou',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'pnpm install',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),

      // 步骤 3
      new Paragraph({
        spacing: { before: 200, after: 150 },
        children: [
          new TextRun({
            text: '【第三步】启动服务',
            bold: true,
            size: 24,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'pnpm dev',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '启动成功后，浏览器自动打开 http://localhost:5173',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 后端服务（可选）
      new Paragraph({
        spacing: { before: 200, after: 150 },
        children: [
          new TextRun({
            text: '【可选】启动后端服务（用于文件上传）',
            bold: true,
            size: 24,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'cd server',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'pnpm install',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'pnpm dev',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),

      // 第三章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '三、配置 API Key',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '平台需要配置 API Key 才能使用 AI 功能。编辑项目根目录下的 .env.local 文件：',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // Gemini
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: '1. Gemini API Key（必需）',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '打开 https://aistudio.google.com 创建 API Key',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'GEMINI_API_KEY=你的 Gemini Key',
            size: 20,
            font: 'Consolas',
            color: '0000FF',
          }),
        ],
      }),

      // 视频生成
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: '2. 视频生成服务（可选，推荐配置至少一个）',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '• Sora2: https://sora2.ai（需申请内测）',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '• Kling: https://klingai.com',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '• Luma: https://lumalabs.ai',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• Runway: https://runwayml.com',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 云屋
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: '3. 云屋 API（国产大模型，中文效果更好）',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '打开 https://yunwu.ai 注册并获取 Key，配置到平台设置面板中',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 第四章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '四、创作流程',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'AIYOU 采用节点式工作流，像搭积木一样简单。',
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 流程图
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: '【完整创作流程】',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '创意描述 → 剧本大纲 → 剧本分集 → 角色设计 → 分镜生成 → 分镜图设计 → 分镜视频',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 节点说明
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: '【核心节点说明】',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '1. 创意描述：输入你的故事想法，AI 扩展成完整故事',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '2. 剧本大纲：一键生成 5-50 集剧本框架',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '3. 剧本分集：自动拆分每集剧情，生成人物对白和场景',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '4. 角色设计：AI 设计角色形象，生成三视图+九宫格表情包',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '5. 分镜生成：根据剧本自动生成分镜脚本，专业镜头语言',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '6. 分镜图设计：文字直接生成 2K 高清分镜画面',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '7. 分镜视频：连接分镜图生成视频，支持多种模型',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 第五章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '五、常见问题',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Q: 启动报错「Port already in use」？',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'A: 端口被占用，可以修改端口或结束占用进程。前端默认 5173 端口，后端默认 3001 端口。',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Q: API Key 配置正确但请求失败？',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'A: 检查网络能否访问 Google（需要 VPN），或检查 API 配额是否耗尽。',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Q: 视频生成失败怎么办？',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'A: 检查 API Key 是否有效，尝试降低分辨率或缩短时长，或切换其他视频生成服务。',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Q: 页面加载慢或显示异常？',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'A: 建议使用 Chrome 或 Edge 浏览器，开启硬件加速，清理浏览器缓存。',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 第六章
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '六、注意事项',
            bold: true,
            size: 28,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '1. API Key 安全：',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 不要将 .env.local 文件分享给他人',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '2. 使用限制：',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '• 各 AI 服务有每日调用限制，超出可能产生费用',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 严禁生成违法、侵权或欺诈内容',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: '3. 数据备份：',
            bold: true,
            size: 22,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: '• 定期导出项目备份，重要素材建议本地存储',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),

      // 结尾
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: '开始创作吧！',
            bold: true,
            size: 32,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '36 天，一个人，一行代码没写。',
            size: 24,
            font: 'Microsoft YaHei',
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '这不是我多厉害，这是 AI 多厉害。',
            size: 24,
            font: 'Microsoft YaHei',
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '一个人，就是一个团队。',
            size: 24,
            font: 'Microsoft YaHei',
            italics: true,
          }),
        ],
      }),

      // 版权
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: '---',
            size: 20,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'AIYOU | 版权归属：光波（a@ggbo.com）',
            size: 18,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '开源协议：MIT',
            size: 18,
            font: 'Microsoft YaHei',
          }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('AIYOU-新手入门指南.docx', buffer);
  console.log('Word 文档已生成：AIYOU-新手入门指南.docx');
});
