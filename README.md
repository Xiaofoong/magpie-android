# Magpie Android

个人 Android ARM64 包装器：启动后自动运行本机网关，直接进入原版 Magpie Web 的供应商页。没有外层启动首页。不是官方 Android APK；核心来自 yetone/magpie，遵循其 MIT 许可证。

当前包装器 0.1.4，构建核心以每个 Release 中的实际版本为准；Android 9+、ARM64。沿用 ai.magpie.mobile 包名和已有更新签名，覆盖安装保留应用数据。后台保护与进程异常恢复保留。

## 跟随官方更新

`.github/workflows/follow-official.yml` 每 15 分钟检查 yetone/magpie-releases 的最新稳定版，也可在 Actions 手动运行。只有新的官方版本或新的 mobileRevision 才发布。GitHub 定时任务可能延迟，长期没有仓库活动也可能停用，不能保证实时更新。

流程为官方源码编译及真实网关接口验证 → 独立任务打包与签名 → 完整上传后公开 Release。构建任务拿不到签名密钥；构建或校验失败不发布。Android Bun 与 ECJ 使用固定版本和 SHA-256 校验，Actions 固定到提交。

手机在服务运行时每 15 分钟检查该仓库的公开 Releases，启动页面时也会检查。发现更新会通知，用户下载后在 Android 系统界面确认覆盖安装。检查入口：长按图标“检查更新”，或“后台保护”页面。无静默安装，不在 APK 中保存 GitHub 令牌。

下载验证文件 SHA-256、大小、包名、升级版本及证书，最终由 Android 安装器验证和安装。正式安装仍需 ARM64 手机验证；本地构建和宿主测试不能替代实机测试。

## 0.1.4 更新入口修复

网页顶部的更新按钮和关于页版本操作统一进入 Android APK 更新页，避免核心试图覆盖 Android 只读安装目录。更新页分别显示官方稳定版和已发布 APK；官方版本领先时明确说明正在等待安卓构建。云端定时任务和手机检查间隔缩短为 15 分钟。GitHub 调度、核心编译和用户确认安装仍需要时间，不保证官方发布后即时可安装。

## 初次部署

此源码只是发布配置，**不会因为有这些文件就自动启用更新**。需要完成下面步骤：

1. 建立专用公开仓库，例如 `Xiaofoong/magpie-android`，将公开源码包内容提交到默认分支。不要提交私有源码备份 ZIP 或 private-signing。
2. Settings → Secrets and variables → Actions，添加两个仓库密钥：`ANDROID_KEYSTORE_BASE64`（已有 magpie-mobile.p12 的 Base64）与 `ANDROID_KEYSTORE_PASSWORD`（已有密码）。这使该仓库的发布工作流能够签发本 App 的升级包，应只给可信维护者写入权限。
3. Actions → Follow official Magpie and publish Android APK → Run workflow。首次运行必须成功，Releases 应出现 APK、android-update.json、SHA256SUMS。然后手机手动检查更新以验证整个流程。
4. 若使用其他仓库，App 更新设置中填写其 `用户名/仓库名`。工作流自动使用所在仓库作为发布渠道。

当前预设渠道为 `Xiaofoong/magpie-android`，**自动构建和签名发布已启用**。现有升级签名密钥保存在本仓库的 Actions Secrets，公开源码不含密钥。首次 0.1.1763 构建及发布成功，后续定时任务已自动跟进 0.1.1780、0.1.1825。公开源码以 ZIP 保存，工作流从同一提交解包源码后构建。

手机安装本项目的 0.1.3 或后续版本后，长按图标选择“检查更新”，或从后台保护页进入。下载后在安卓系统界面确认覆盖安装，保留应用数据；不要先卸载。旧版没有更新入口时，先从 Releases 下载并覆盖安装。

2026-10-28 已完成云端发布检查；未声称完成 ARM64 真机的系统安装器或长期后台测试。

## 本地构建

要求 Python 3、Java 17、Go（按官方 go.mod）、Android SDK platform 35 / build-tools 35.0.1。ECJ/Bun 由依赖脚本下载并校验。

```sh
python3 ci/follow_official.py dependencies --plan android/release.json
# 生成 plan 后抓取对应官方 tag，构建核心并运行宿主接口契约：
python3 ci/follow_official.py source --plan build-plan.json
python3 ci/follow_official.py build-core --plan build-plan.json
ANDROID_SDK_ROOT=/absolute/sdk ECJ_JAR="$PWD/toolchain/ecj.jar" MAGPIE_BUILD_INFO="$PWD/build-plan.json" MAGPIE_UNSIGNED=1 python3 android/build.py
```

构建计划结构见 android/release.json；CI 的 probe 命令会生成含 upstreamTag、releaseTag 等字段的完整计划。签名使用 ci/sign_release.py；CI 从 Secrets 注入，本地应在不打印凭据的环境中使用原密钥。更新必须保持同一签名，丢失密钥后无法覆盖旧版本。

公开源码包只包含白名单源码和文档，不包括任何密钥、密码、用户配置、APK 或工具链。`ci/export_source.py` 可重新生成。

## 许可证

Magpie 核心的许可证见 android/app/src/main/assets/LICENSE-MAGPIE.txt，Bun 许可证见 LICENSE-BUN.md。APK 包含这两份声明。
