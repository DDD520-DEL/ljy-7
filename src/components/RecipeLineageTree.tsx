import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, GitFork, User, Calendar, ChevronRight } from 'lucide-react';
import type { Recipe } from '../../shared/types.js';
import { cn } from '../lib/utils.js';

interface LineageNode {
  id: string;
  recipe: Recipe;
  children: LineageNode[];
  depth: number;
  isFork: boolean;
}

interface RecipeLineageTreeProps {
  recipes: Recipe[];
  currentRecipeId: string;
  className?: string;
}

export default function RecipeLineageTree({ recipes, currentRecipeId, className }: RecipeLineageTreeProps) {
  const navigate = useNavigate();

  const { rootNodes, currentAncestors } = useMemo(() => {
    const recipeMap = new Map<string, Recipe>();
    recipes.forEach(r => recipeMap.set(r.id, r));

    const childrenMap = new Map<string, string[]>();
    recipes.forEach(r => {
      if (r.parentId) {
        if (!childrenMap.has(r.parentId)) {
          childrenMap.set(r.parentId, []);
        }
        childrenMap.get(r.parentId)!.push(r.id);
      }
    });

    const findRoots = (): string[] => {
      return recipes
        .filter(r => !r.parentId || !recipeMap.has(r.parentId))
        .map(r => r.id);
    };

    const buildNode = (id: string, depth: number, isFork: boolean): LineageNode => {
      const recipe = recipeMap.get(id)!;
      const childIds = childrenMap.get(id) || [];
      const children = childIds.map(childId => {
        const childRecipe = recipeMap.get(childId)!;
        const childIsFork = childRecipe.createdBy !== recipe.createdBy;
        return buildNode(childId, depth + 1, childIsFork);
      });

      children.sort((a, b) => {
        const aDate = new Date(a.recipe.createdAt).getTime();
        const bDate = new Date(b.recipe.createdAt).getTime();
        return aDate - bDate;
      });

      return { id, recipe, children, depth, isFork };
    };

    const rootIds = findRoots();
    const roots = rootIds.map(id => buildNode(id, 0, false));

    const findAncestors = (targetId: string): string[] => {
      const ancestors: string[] = [];
      let current = recipeMap.get(targetId);
      while (current?.parentId && recipeMap.has(current.parentId)) {
        ancestors.unshift(current.parentId);
        current = recipeMap.get(current.parentId);
      }
      return ancestors;
    };

    return {
      rootNodes: roots,
      currentAncestors: findAncestors(currentRecipeId)
    };
  }, [recipes, currentRecipeId]);

  const allNodes = useMemo(() => {
    const nodes: LineageNode[] = [];
    const traverse = (node: LineageNode) => {
      nodes.push(node);
      node.children.forEach(traverse);
    };
    rootNodes.forEach(traverse);
    return nodes;
  }, [rootNodes]);

  const maxDepth = useMemo(() => {
    let max = 0;
    const traverse = (node: LineageNode) => {
      max = Math.max(max, node.depth);
      node.children.forEach(traverse);
    };
    rootNodes.forEach(traverse);
    return max;
  }, [rootNodes]);

  const renderNode = (node: LineageNode, isLast: boolean, parentPath: boolean[]) => {
    const isCurrent = node.id === currentRecipeId;
    const isAncestor = currentAncestors.includes(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
            isCurrent
              ? "bg-amber-50 border-amber-300 shadow-md"
              : isAncestor
              ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
              : node.isFork
              ? "bg-purple-50 border-purple-200 hover:bg-purple-100"
              : "bg-white border-gray-200 hover:bg-gray-50",
            "hover:shadow-md"
          )}
          onClick={() => navigate(`/recipes/${node.id}`)}
        >
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isCurrent
                  ? "bg-amber-500 text-white"
                  : isAncestor
                  ? "bg-blue-500 text-white"
                  : node.isFork
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {node.isFork ? (
                <GitFork size={20} />
              ) : (
                <GitBranch size={20} />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-semibold truncate",
                isCurrent ? "text-amber-900" : "text-gray-900"
              )}>
                {node.recipe.name}
              </span>
              {isCurrent && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  当前
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono">v{node.recipe.version}</span>
              {node.recipe.branchName && (
                <span className="flex items-center gap-1 text-xs">
                  <GitBranch size={12} />
                  {node.recipe.branchName}
                </span>
              )}
              {node.isFork && (
                <span className="flex items-center gap-1 text-xs text-purple-600">
                  <GitFork size={12} />
                  Fork
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <User size={12} />
                {node.recipe.createdBy}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(node.recipe.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>

          <ChevronRight
            size={20}
            className={cn(
              "flex-shrink-0 mt-2 transition-colors",
              isCurrent ? "text-amber-500" : "text-gray-300"
            )}
          />
        </div>

        {hasChildren && (
          <div className="ml-6 mt-1 pl-6 border-l-2 border-gray-200 space-y-1">
            {node.children.map((child, index) =>
              renderNode(child, index === node.children.length - 1, [...parentPath, !isLast])
            )}
          </div>
        )}
      </div>
    );
  };

  const totalVersions = allNodes.length;
  const forkCount = allNodes.filter(n => n.isFork).length;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 overflow-hidden", className)}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch className="text-amber-600" size={20} />
              配方演变谱系
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              展示该配方的完整版本演变链和派生关系
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">{totalVersions}</div>
              <div className="text-xs text-gray-500">总版本数</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{forkCount}</div>
              <div className="text-xs text-gray-500">Fork 数</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{maxDepth + 1}</div>
              <div className="text-xs text-gray-500">演变深度</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            当前版本
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            祖先版本
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            Fork 派生
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            其他分支
          </div>
        </div>
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        {rootNodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GitBranch size={48} className="mx-auto mb-4 text-gray-300" />
            <p>暂无版本记录</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rootNodes.map((root, index) =>
              renderNode(root, index === rootNodes.length - 1, [])
            )}
          </div>
        )}
      </div>
    </div>
  );
}
