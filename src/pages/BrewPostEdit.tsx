import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ImagePlus, X, Beer } from 'lucide-react';
import { useBrewStore } from '../store/brewStore.js';
import MarkdownEditor from '../components/MarkdownEditor.js';
import type { BrewPostImage } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

const CURRENT_USER_ID = 'currentUser';
const CURRENT_USER_NAME = '我';

export default function BrewPostEdit() {
  const navigate = useNavigate();
  const { batches, recipes, fetchBatches, fetchRecipes, createBrewPost, loading, error } = useBrewStore();

  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [images, setImages] = useState<BrewPostImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  useEffect(() => {
    fetchBatches();
    fetchRecipes();
  }, [fetchBatches, fetchRecipes]);

  const completedBatches = batches.filter(b =>
    b.status === 'completed' || b.status === 'bottled'
  );

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, { url: newImageUrl.trim(), caption: newImageCaption.trim() || undefined }]);
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim() || !content.trim()) return;

    const result = await createBrewPost({
      title: title.trim(),
      coverImage: coverImage.trim(),
      content: content.trim(),
      authorId: CURRENT_USER_ID,
      authorName: CURRENT_USER_NAME,
      batchId: selectedBatchId || undefined,
      recipeId: selectedRecipeId || undefined,
      images,
    });

    if (result) {
      navigate('/plaza');
    }
  };

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    const batch = batches.find(b => b.id === batchId);
    if (batch && batch.recipeId) {
      setSelectedRecipeId(batch.recipeId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/plaza')}
          className="p-2 text-gray-500 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-amber-900">发布酿造心得</h1>
          <p className="text-sm text-gray-500">将你的酿造经历整理成图文贴分享到广场</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的酿造心得起个标题..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
            maxLength={100}
            required
          />
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">封面图 *</label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="输入封面图片URL..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
          {coverImage && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 h-48">
              <img
                src={coverImage}
                alt="封面预览"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20beer%20brewing%20warm%20amber%20color&image_size=landscape_16_9';
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">关联批次</label>
          <select
            value={selectedBatchId}
            onChange={(e) => handleBatchSelect(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">不关联批次</option>
            {completedBatches.map(batch => (
              <option key={batch.id} value={batch.id}>
                {batch.name} ({batch.brewDate}) - {batch.recipeName || '未知配方'}
              </option>
            ))}
          </select>
          {selectedBatchId && (
            <p className="mt-2 text-xs text-amber-600">
              发布时将自动附上源配方链接
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">关联配方</label>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">不关联配方</option>
            {recipes.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name} ({recipe.style}) v{recipe.version}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">正文 *</label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="记录你的酿造过程、心得体会、技巧分享..."
            minHeight="400px"
          />
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">附加图片</label>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="图片URL"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
            <input
              type="text"
              value={newImageCaption}
              onChange={(e) => setNewImageCaption(e.target.value)}
              placeholder="图片说明（可选）"
              className="w-40 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!newImageUrl.trim()}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                newImageUrl.trim()
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <ImagePlus size={16} />
              添加
            </button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 group">
                  <img
                    src={img.url}
                    alt={img.caption || `图片 ${idx + 1}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beer%20brewing%20process&image_size=landscape_4_3';
                    }}
                  />
                  {img.caption && (
                    <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50">{img.caption}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/plaza')}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !coverImage.trim() || !content.trim() || loading}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors",
              title.trim() && coverImage.trim() && content.trim() && !loading
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Save size={18} />
            {loading ? '发布中...' : '发布心得'}
          </button>
        </div>
      </form>
    </div>
  );
}
