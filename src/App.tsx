import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Beer, Home as HomeIcon, ListTodo, Star, Users, Package, Settings, Droplets, ShoppingCart, Flame } from "lucide-react";
import Home from "@/pages/Home";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import RecipeEdit from "@/pages/RecipeEdit";
import RecipeCompare from "@/pages/RecipeCompare";
import Batches from "@/pages/Batches";
import BatchDetail from "@/pages/BatchDetail";
import BatchEdit from "@/pages/BatchEdit";
import TraceCodeLookup from "@/pages/TraceCodeLookup";
import Tastings from "@/pages/Tastings";
import TastingEdit from "@/pages/TastingEdit";
import Community from "@/pages/Community";
import BrewPlaza from "@/pages/BrewPlaza";
import BrewPostEdit from "@/pages/BrewPostEdit";
import Inventory from "@/pages/Inventory";
import Procurement from "@/pages/Procurement";
import Equipment from "@/pages/Equipment";
import WaterAnalysis from "@/pages/WaterAnalysis";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "首页", icon: HomeIcon },
  { path: "/recipes", label: "配方管理", icon: Beer },
  { path: "/batches", label: "酿造批次", icon: ListTodo },
  { path: "/water", label: "水质分析", icon: Droplets },
  { path: "/equipment", label: "设备管理", icon: Settings },
  { path: "/inventory", label: "原料库存", icon: Package },
  { path: "/procurement", label: "采购记录", icon: ShoppingCart },
  { path: "/tastings", label: "品鉴评分", icon: Star },
  { path: "/community", label: "社区分享", icon: Users },
  { path: "/plaza", label: "酿造广场", icon: Flame },
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Beer className="w-8 h-8" />
            <span className="text-xl font-bold">酿造工坊</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive
                      ? "bg-amber-700 text-white"
                      : "text-amber-100 hover:bg-amber-700/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-amber-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/new" element={<RecipeEdit />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeEdit />} />
            <Route path="/recipes/compare/:idA/:idB" element={<RecipeCompare />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/new" element={<BatchEdit />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/batches/:id/edit" element={<BatchEdit />} />
            <Route path="/trace" element={<TraceCodeLookup />} />
            <Route path="/water" element={<WaterAnalysis />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/tastings" element={<Tastings />} />
            <Route path="/tastings/new" element={<TastingEdit />} />
            <Route path="/tastings/:id" element={<Tastings />} />
            <Route path="/tastings/:id/edit" element={<TastingEdit />} />
            <Route path="/community" element={<Community />} />
            <Route path="/plaza" element={<BrewPlaza />} />
            <Route path="/plaza/new" element={<BrewPostEdit />} />
          </Routes>
        </main>
        <footer className="bg-amber-900 text-amber-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="flex items-center justify-center gap-2">
              <Beer className="w-4 h-4" />
              <span>手工酿造配方版本管理与批次日志系统 © 2024</span>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
