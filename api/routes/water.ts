import express, { type Request, type Response } from 'express';
import { analyzeWater } from '../../src/utils/calculations.js';
import { MINERAL_COMPOUNDS, BEER_STYLE_WATER_TARGETS } from '../../shared/types.js';
import type { WaterAnalysisResult, WaterProfile } from '../../shared/types.js';

const router = express.Router();

interface AnalyzeWaterRequest {
  calcium: number;
  magnesium: number;
  sodium: number;
  sulfate: number;
  chloride: number;
  bicarbonate: number;
  ph?: number;
  style: string;
  batchSize: number;
}

router.post('/analyze', (req: Request, res: Response) => {
  try {
    const { calcium, magnesium, sodium, sulfate, chloride, bicarbonate, ph, style, batchSize } = req.body as AnalyzeWaterRequest;

    if (!style || !batchSize) {
      return res.status(400).json({
        success: false,
        error: '啤酒风格和批次大小是必填项',
      });
    }

    const requiredFields = ['calcium', 'magnesium', 'sodium', 'sulfate', 'chloride', 'bicarbonate'];
    for (const field of requiredFields) {
      if ((req.body as Record<string, unknown>)[field] === undefined || (req.body as Record<string, unknown>)[field] === null) {
        return res.status(400).json({
          success: false,
          error: `缺少必要字段: ${field}`,
        });
      }
      if (typeof (req.body as Record<string, unknown>)[field] !== 'number' || (req.body as Record<string, number>)[field] < 0) {
        return res.status(400).json({
          success: false,
          error: `字段 ${field} 必须是非负数字`,
        });
      }
    }

    if (batchSize <= 0) {
      return res.status(400).json({
        success: false,
        error: '批次大小必须大于0',
      });
    }

    const result = analyzeWater(
      { calcium, magnesium, sodium, sulfate, chloride, bicarbonate, ph },
      style,
      batchSize,
      MINERAL_COMPOUNDS,
      BEER_STYLE_WATER_TARGETS
    );

    if (!result) {
      return res.status(400).json({
        success: false,
        error: `不支持的啤酒风格: ${style}`,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('水质分析错误:', error);
    res.status(500).json({
      success: false,
      error: '水质分析失败',
    });
  }
});

router.get('/styles', (req: Request, res: Response) => {
  try {
    const styles = BEER_STYLE_WATER_TARGETS.map(target => ({
      style: target.style,
      description: target.description,
      ranges: {
        calcium: target.calcium,
        magnesium: target.magnesium,
        sodium: target.sodium,
        sulfate: target.sulfate,
        chloride: target.chloride,
        bicarbonate: target.bicarbonate,
        ph: target.ph,
      },
      tips: target.tips,
    }));

    res.json({
      success: true,
      data: styles,
    });
  } catch (error) {
    console.error('获取水化学区间错误:', error);
    res.status(500).json({
      success: false,
      error: '获取水化学区间失败',
    });
  }
});

router.get('/minerals', (req: Request, res: Response) => {
  try {
    const minerals = MINERAL_COMPOUNDS.map(mineral => ({
      name: mineral.name,
      formula: mineral.formula,
      contributions: {
        calcium: mineral.calciumPerGram,
        magnesium: mineral.magnesiumPerGram,
        sodium: mineral.sodiumPerGram,
        sulfate: mineral.sulfatePerGram,
        chloride: mineral.chloridePerGram,
        bicarbonate: mineral.bicarbonatePerGram,
      },
      solubility: mineral.solubility,
      unit: mineral.unit,
    }));

    res.json({
      success: true,
      data: minerals,
    });
  } catch (error) {
    console.error('获取矿物质数据错误:', error);
    res.status(500).json({
      success: false,
      error: '获取矿物质数据失败',
    });
  }
});

let savedWaterProfiles: WaterProfile[] = [];

router.get('/profiles', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: savedWaterProfiles,
    });
  } catch (error) {
    console.error('获取水源配置错误:', error);
    res.status(500).json({
      success: false,
      error: '获取水源配置失败',
    });
  }
});

router.post('/profiles', (req: Request, res: Response) => {
  try {
    const { name, calcium, magnesium, sodium, sulfate, chloride, bicarbonate, ph, note } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: '水源名称是必填项',
      });
    }

    const newProfile: WaterProfile = {
      id: `water-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      calcium,
      magnesium,
      sodium,
      sulfate,
      chloride,
      bicarbonate,
      ph,
      createdAt: new Date().toISOString(),
      createdBy: 'currentUser',
      note,
    };

    savedWaterProfiles.push(newProfile);

    res.status(201).json({
      success: true,
      data: newProfile,
    });
  } catch (error) {
    console.error('保存水源配置错误:', error);
    res.status(500).json({
      success: false,
      error: '保存水源配置失败',
    });
  }
});

router.delete('/profiles/:id', (req: Request, res: Response) => {
  try {
    const index = savedWaterProfiles.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: '水源配置不存在',
      });
    }

    savedWaterProfiles.splice(index, 1);

    res.json({
      success: true,
      message: '水源配置已删除',
    });
  } catch (error) {
    console.error('删除水源配置错误:', error);
    res.status(500).json({
      success: false,
      error: '删除水源配置失败',
    });
  }
});

export default router;
