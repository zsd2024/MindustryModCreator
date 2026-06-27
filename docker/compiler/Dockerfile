FROM eclipse-temurin:17-jdk

# 安装必要工具
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 下载 Mindustry API
RUN mkdir -p /libs && \
    wget -O /libs/mindustry.jar https://github.com/Anuken/Mindustry/releases/download/v145/Mindustry.jar

# 创建目录结构
RUN mkdir -p /src /out/classes /output

# 设置工作目录
WORKDIR /src

# 默认命令
CMD ["echo", "Mindustry 编译沙箱已就绪"]