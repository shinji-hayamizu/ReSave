.PHONY: claude-phase1 claude-phase2

# 使い方:
#   make claude-phase1 OVERVIEW_FILE=./service-overview.md
#   make claude-phase2
#
# Claude Code CLI が必要です（例: `claude` コマンドが通ること）

OVERVIEW_FILE ?= ./service-overview.md

claude-phase1:
	@bash ./scripts/claude/phase1_business_requirements.sh "$(OVERVIEW_FILE)"

claude-phase2:
	@bash ./scripts/claude/phase2_tech_requirements.sh


