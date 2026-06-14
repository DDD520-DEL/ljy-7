import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_HOST = 'localhost';
const API_PORT = 3003;
const DATA_FILE = path.join(__dirname, 'api/data/water-profiles.json');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

function makeRequest<T>(options: http.RequestOptions, body?: unknown): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) as T });
        } catch (e) {
          resolve({ status: res.statusCode || 500, data: data as unknown as T });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - startTime,
    });
    console.log(`✅ ${name} (${Date.now() - startTime}ms)`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.log(`❌ ${name} (${Date.now() - startTime}ms)`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function cleanTestData(): void {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Array<{ name: string }>;
    const filtered = data.filter((p) => !p.name.startsWith('测试水源_'));
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  }
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('  水源配置持久化功能测试');
  console.log('========================================\n');

  cleanTestData();

  let createdId: string;
  const testProfile = {
    name: `测试水源_${Date.now()}`,
    calcium: 50,
    magnesium: 15,
    sodium: 20,
    sulfate: 50,
    chloride: 30,
    bicarbonate: 80,
    ph: 7.2,
    note: '自动测试用水源配置',
  };

  await runTest('1. 初始化时数据文件可正常读取', async () => {
    const response = await makeRequest<{ success: boolean; data: Array<{ id: string }> }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`获取列表失败: ${JSON.stringify(response.data)}`);
    }
  });

  await runTest('2. 创建水源配置 - 成功返回201', async () => {
    const response = await makeRequest<{ success: boolean; data: { id: string; name: string } }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, testProfile);

    if (response.status !== 201) {
      throw new Error(`期望状态码201，实际${response.status}`);
    }
    if (!response.data.success) {
      throw new Error(`创建失败: ${JSON.stringify(response.data)}`);
    }
    if (!response.data.data.id) {
      throw new Error('返回数据中缺少ID');
    }
    createdId = response.data.data.id;
  });

  await runTest('3. 创建后列表中包含新配置', async () => {
    const response = await makeRequest<{ success: boolean; data: Array<{ id: string; name: string }> }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const profiles = response.data.data;
    const found = profiles.find((p) => p.id === createdId);
    if (!found) {
      throw new Error('创建的配置未在列表中找到');
    }
    if (found.name !== testProfile.name) {
      throw new Error(`名称不匹配: 期望"${testProfile.name}"，实际"${found.name}"`);
    }
  });

  await runTest('4. 按ID获取水源配置', async () => {
    const response = await makeRequest<{ success: boolean; data: { id: string; calcium: number; magnesium: number } }>({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/water/profiles/${createdId}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200 || !response.data.success) {
      throw new Error(`获取失败: ${JSON.stringify(response.data)}`);
    }
    if (response.data.data.id !== createdId) {
      throw new Error('返回的ID不匹配');
    }
    if (response.data.data.calcium !== testProfile.calcium) {
      throw new Error(`钙浓度不匹配: 期望${testProfile.calcium}，实际${response.data.data.calcium}`);
    }
  });

  await runTest('5. 获取不存在的ID返回404', async () => {
    const response = await makeRequest<{ success: boolean; error: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles/non-existent-id',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 404) {
      throw new Error(`期望状态码404，实际${response.status}`);
    }
  });

  await runTest('6. 更新水源配置', async () => {
    const updates = {
      calcium: 60,
      magnesium: 20,
      note: '已更新的配置',
    };
    const response = await makeRequest<{ success: boolean; data: { calcium: number; magnesium: number; note: string } }>({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/water/profiles/${createdId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, updates);

    if (response.status !== 200 || !response.data.success) {
      throw new Error(`更新失败: ${JSON.stringify(response.data)}`);
    }
    if (response.data.data.calcium !== updates.calcium) {
      throw new Error(`钙浓度未更新: 期望${updates.calcium}，实际${response.data.data.calcium}`);
    }
    if (response.data.data.note !== updates.note) {
      throw new Error(`备注未更新`);
    }
  });

  await runTest('7. 更新不存在的ID返回404', async () => {
    const response = await makeRequest<{ success: boolean; error: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles/non-existent-id',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, { calcium: 100 });

    if (response.status !== 404) {
      throw new Error(`期望状态码404，实际${response.status}`);
    }
  });

  await runTest('8. 数据持久化到文件', async () => {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`数据文件不存在: ${DATA_FILE}`);
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent) as Array<{ id: string }>;
    const found = data.find((p) => p.id === createdId);
    if (!found) {
      throw new Error('创建的配置未在数据文件中找到');
    }
  });

  await runTest('9. 创建水源配置 - 缺少必填字段返回400', async () => {
    const invalidProfile = {
      name: '测试缺少字段',
      calcium: 50,
    };
    const response = await makeRequest<{ success: boolean; error: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, invalidProfile);

    if (response.status !== 400) {
      throw new Error(`期望状态码400，实际${response.status}`);
    }
  });

  await runTest('10. 创建水源配置 - 缺少名称返回400', async () => {
    const invalidProfile = {
      calcium: 50,
      magnesium: 15,
      sodium: 20,
      sulfate: 50,
      chloride: 30,
      bicarbonate: 80,
    };
    const response = await makeRequest<{ success: boolean; error: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, invalidProfile);

    if (response.status !== 400) {
      throw new Error(`期望状态码400，实际${response.status}`);
    }
  });

  await runTest('11. 删除水源配置', async () => {
    const response = await makeRequest<{ success: boolean; message: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/water/profiles/${createdId}`,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200 || !response.data.success) {
      throw new Error(`删除失败: ${JSON.stringify(response.data)}`);
    }
  });

  await runTest('12. 删除后列表中不再包含该配置', async () => {
    const response = await makeRequest<{ success: boolean; data: Array<{ id: string }> }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const profiles = response.data.data;
    const found = profiles.find((p) => p.id === createdId);
    if (found) {
      throw new Error('删除的配置仍然在列表中');
    }
  });

  await runTest('13. 删除后数据文件中不再包含该配置', async () => {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent) as Array<{ id: string }>;
    const found = data.find((p) => p.id === createdId);
    if (found) {
      throw new Error('删除的配置仍然在数据文件中');
    }
  });

  await runTest('14. 删除不存在的ID返回404', async () => {
    const response = await makeRequest<{ success: boolean; error: string }>({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/water/profiles/non-existent-id',
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 404) {
      throw new Error(`期望状态码404，实际${response.status}`);
    }
  });

  await runTest('15. 批量创建多个配置并验证持久化', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await makeRequest<{ success: boolean; data: { id: string } }>({
        hostname: API_HOST,
        port: API_PORT,
        path: '/api/water/profiles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, {
        ...testProfile,
        name: `测试水源_批量_${Date.now()}_${i}`,
        calcium: 50 + i * 10,
      });
      ids.push(response.data.data.id);
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent) as Array<{ id: string }>;
    
    for (const id of ids) {
      const found = data.find((p) => p.id === id);
      if (!found) {
        throw new Error(`批量创建的配置 ${id} 未在数据文件中找到`);
      }
    }

    for (const id of ids) {
      await makeRequest({
        hostname: API_HOST,
        port: API_PORT,
        path: `/api/water/profiles/${id}`,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  cleanTestData();

  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`通过: ${passed}/${total} 项测试`);
  console.log(`总耗时: ${totalTime}ms\n`);

  if (passed < total) {
    console.log('失败的测试:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`);
        console.log(`    ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('🎉 所有测试通过！水源配置持久化功能正常工作。');
    console.log(`   数据文件位置: ${DATA_FILE}`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
