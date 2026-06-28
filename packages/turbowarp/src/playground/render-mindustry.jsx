import React from 'react';
import styles from './mindustry.css';

const MindustryHome = () => {
  const handleStartCreating = () => {
    window.location.href = `${process.env.ROOT || '/'}editor.html`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo}>Mindustry Mod Creator</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroAccent}>Mindustry-Scratch</span>
            <br />
            在线图形化 Mod 编辑器
          </h1>
          <p className={styles.heroSubtitle}>
            零代码门槛、全在线运行的 Mindustry Mod 开发平台。
            <br />
            拖拽积木即可创作，无需任何编程基础。
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={handleStartCreating}>
              开始创建 Mod
            </button>
            <a
              className={styles.btnSecondary}
              href="https://github.com/TurboWarp/scratch-gui"
              target="_blank"
              rel="noreferrer"
            >
              了解更多
            </a>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>内容驱动</h3>
            <p>树形文件夹管理方块、物品、单位等游戏内容，拖拽即可组织 Mod 结构。</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🧩</div>
            <h3>渐进式复杂度</h3>
            <p>从 HJSON 可视化表单到 Java 积木逻辑，智能切换。新手从填表单开始，平滑过渡到写逻辑。</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>安全隔离编译</h3>
            <p>后端 Docker 容器化编译，环境高度一致，代码执行绝对安全，一键生成 .jar 文件。</p>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.stat}>
            <strong>零代码</strong>
            <span>拖拽积木即可创建 Mod</span>
          </div>
          <div className={styles.stat}>
            <strong>全在线</strong>
            <span>无需安装任何软件</span>
          </div>
          <div className={styles.stat}>
            <strong>高性能</strong>
            <span>生成原生 Java Mod</span>
          </div>
          <div className={styles.stat}>
            <strong>100% 兼容</strong>
            <span>标准 Mindustry Mod</span>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>Mindustry Mod Creator 基于 TurboWarp (scratch-gui) 深度魔改。</p>
          <p>
            Mindustry 是 Anuken 的游戏。
            Scratch 是 Scratch Foundation 的项目。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MindustryHome;
