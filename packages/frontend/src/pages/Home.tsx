import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>Mindustry-Scratch 在线图形化 Mod 编辑器</h1>
        <p className="home-subtitle">
          零代码门槛、全在线运行的 Mindustry Mod 开发平台
        </p>
        <div className="home-features">
          <div className="feature">
            <h3>内容驱动</h3>
            <p>摒弃传统 IDE 的"文件树"概念，将编辑器核心重构为"游戏内容"的资产管理</p>
          </div>
          <div className="feature">
            <h3>渐进式复杂度</h3>
            <p>通过"HJSON 表单"与"Java 积木"的智能双模式自动切换，让新手从填表单开始</p>
          </div>
          <div className="feature">
            <h3>安全隔离编译</h3>
            <p>后端采用 Docker 容器化编译，确保代码执行绝对安全，且环境高度一致</p>
          </div>
        </div>
        <div className="home-actions">
          <Link to="/editor" className="btn btn-primary">
            开始创建 Mod
          </Link>
          <a href="#learn-more" className="btn btn-secondary">
            了解更多
          </a>
        </div>
      </div>
      <div className="home-stats">
        <div className="stat">
          <h4>零代码</h4>
          <p>拖拽积木即可创建 Mod</p>
        </div>
        <div className="stat">
          <h4>全在线</h4>
          <p>无需安装任何软件</p>
        </div>
        <div className="stat">
          <h4>高性能</h4>
          <p>生成原生 Java Mod</p>
        </div>
      </div>
    </div>
  );
};

export default Home;