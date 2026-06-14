import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { BrewPhoto, BrewStage } from '../../shared/types.js';
import { BREW_STAGE_LABELS } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

interface BrewPhotoGalleryProps {
  photos: BrewPhoto[];
  onAddPhoto: (stage: BrewStage, file: File, caption: string) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onUpdateCaption?: (photoId: string, caption: string) => Promise<void>;
  disabled?: boolean;
}

const stageColors: Record<BrewStage, string> = {
  mashing: 'bg-amber-100 text-amber-700 border-amber-200',
  boiling: 'bg-red-100 text-red-700 border-red-200',
  fermentation: 'bg-green-100 text-green-700 border-green-200',
  bottling: 'bg-blue-100 text-blue-700 border-blue-200',
};

const stageBgColors: Record<BrewStage, string> = {
  mashing: 'bg-amber-50',
  boiling: 'bg-red-50',
  fermentation: 'bg-green-50',
  bottling: 'bg-blue-50',
};

export default function BrewPhotoGallery({ photos, onAddPhoto, onDeletePhoto, onUpdateCaption, disabled }: BrewPhotoGalleryProps) {
  const [expandedStages, setExpandedStages] = useState<Record<BrewStage, boolean>>({
    mashing: true,
    boiling: true,
    fermentation: true,
    bottling: true,
  });
  const [uploadingStage, setUploadingStage] = useState<BrewStage | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages: BrewStage[] = ['mashing', 'boiling', 'fermentation', 'bottling'];

  const getPhotosByStage = (stage: BrewStage) => {
    return photos.filter(p => p.stage === stage).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  };

  const toggleStage = (stage: BrewStage) => {
    setExpandedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  const handleFileSelect = async (stage: BrewStage, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingStage(stage);
    try {
      for (const file of Array.from(files)) {
        await onAddPhoto(stage, file, '');
      }
    } finally {
      setUploadingStage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditCaption = (photo: BrewPhoto) => {
    setEditingPhotoId(photo.id);
    setEditCaption(photo.caption);
  };

  const handleSaveCaption = async (photoId: string) => {
    if (onUpdateCaption) {
      await onUpdateCaption(photoId, editCaption);
    }
    setEditingPhotoId(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (uploadingStage) {
            handleFileSelect(uploadingStage, e);
          }
        }}
      />

      {stages.map(stage => {
        const stagePhotos = getPhotosByStage(stage);
        const isExpanded = expandedStages[stage];

        return (
          <div
            key={stage}
            className={cn(
              "border rounded-xl overflow-hidden transition-all",
              stageColors[stage]
            )}
          >
            <button
              onClick={() => toggleStage(stage)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between font-medium",
                stageBgColors[stage]
              )}
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={18} />
                <span>{BREW_STAGE_LABELS[stage]}</span>
                <span className="text-sm opacity-70">({stagePhotos.length})</span>
              </div>
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isExpanded && (
              <div className="p-4 bg-white border-t border-gray-100">
                {stagePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {stagePhotos.map(photo => (
                      <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={photo.url}
                          alt={photo.caption || BREW_STAGE_LABELS[stage]}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleEditCaption(photo)}
                            className="p-2 bg-white rounded-full text-gray-700 hover:text-amber-600 mx-1"
                            title="编辑说明"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDeletePhoto(photo.id)}
                            className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 mx-1"
                            title="删除照片"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm mb-4">
                    <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                    暂无照片
                  </div>
                )}

                {!disabled && (
                  <button
                    onClick={() => {
                      setUploadingStage(stage);
                      triggerFileInput();
                    }}
                    disabled={uploadingStage === stage}
                    className={cn(
                      "w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-medium transition-colors",
                      uploadingStage === stage
                        ? "border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
                    )}
                  >
                    {uploadingStage === stage ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        上传{BREW_STAGE_LABELS[stage]}照片
                      </>
                    )}
                  </button>
                )}

                {editingPhotoId && stagePhotos.some(p => p.id === editingPhotoId) && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                      <h4 className="font-semibold text-gray-900 mb-4">编辑照片说明</h4>
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="添加照片说明..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-4"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditingPhotoId(null)}
                          className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSaveCaption(editingPhotoId)}
                          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
