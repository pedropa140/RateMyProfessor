import subprocess

def format_number(num):
    if num < 10:
        return f"0{num}"
    else:
        return str(num)

def git_push(branch="master"):
    try:
        subprocess.run(["git", "add", "."], check=True)
        
        commit_message = input("Enter your commit message: ")
        message = f'{commit_message}'
        subprocess.run(["git", "commit", "-m", message], check=True)
        subprocess.run(["git", "push"], check=True)

        print("git push successful!")

    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        print("git push failed.")

if __name__ == "__main__":
    git_push()
