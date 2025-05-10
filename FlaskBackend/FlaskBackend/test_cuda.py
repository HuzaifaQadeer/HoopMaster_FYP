import torch
import sys

def test_cuda():
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"Current CUDA device: {torch.cuda.current_device()}")
        print(f"CUDA device name: {torch.cuda.get_device_name(0)}")
        
        # Test CUDA tensor operations
        x = torch.rand(5, 3)
        print("\nCPU Tensor:")
        print(x)
        
        x = x.cuda()
        print("\nGPU Tensor:")
        print(x)
        
        # Test basic operation
        y = torch.rand(5, 3).cuda()
        z = x + y
        print("\nGPU Operation Result:")
        print(z)
    else:
        print("CUDA is not available. Please check your PyTorch installation.")
        print("Try reinstalling PyTorch with CUDA support:")
        print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")

if __name__ == "__main__":
    test_cuda() 