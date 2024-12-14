#!/usr/bin/env python3
import os
import re
import sys

# Branch 규칙 정의
BRANCH_PATTERNS = [
    r"^feature-",
    r"^fix-",
    r"^chore-",
    r"^docs-",
    r"^refactor-"
]

# Commit 메시지 규칙 정의
COMMIT_PATTERNS = {
    "feature-": r"^feature:",
    "fix-": r"^fix:",
    "chore-": r"^chore:",
    "docs-": r"^docs:",
    "refactor-": r"^refactor:"
}

def get_current_branch():
    """현재 Git branch 이름을 반환"""
    branch = os.popen("git symbolic-ref --short HEAD").read().strip()
    return branch

def validate_branch_name(branch_name):
    """Branch 이름이 규칙을 따르는지 확인"""
    for pattern in BRANCH_PATTERNS:
        if re.match(pattern, branch_name):
            return True
    return False

def validate_commit_message(branch_name, commit_message):
    """Branch 이름과 Commit 메시지 규칙을 확인"""
    prefix = branch_name.split('-')[0] + ":"
    pattern = COMMIT_PATTERNS.get(branch_name.split('-')[0] + "-")
    if pattern and re.match(pattern, commit_message):
        return True
    return False

def main():
    branch_name = get_current_branch()
    if not validate_branch_name(branch_name):
        print(f"❌ Invalid branch name: '{branch_name}'")
        print("Branch name must start with one of the following prefixes:")
        print(", ".join([pattern.strip("^").rstrip("-") for pattern in BRANCH_PATTERNS]))
        sys.exit(1)

    if len(sys.argv) < 2:
        print("❌ Commit message file is not provided.")
        sys.exit(1)

    # Git에서 전달된 커밋 메시지 파일 경로
    commit_message_file = sys.argv[1]
    try:
        with open(commit_message_file, "r") as file:
            commit_message = file.readline().strip()
    except FileNotFoundError:
        print("❌ Commit message file not found.")
        sys.exit(1)
        
    if not validate_commit_message(branch_name, commit_message):
        print(f"❌ Invalid commit message for branch '{branch_name}'")
        print("Commit message must start with the same prefix as the branch:")
        print(f"Expected prefix: \"{branch_name.split('-')[0]}:\"")
        sys.exit(1)

    print("✅ Commit message and branch name validation passed!")

if __name__ == "__main__":
    main()
