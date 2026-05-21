# This is a sample Python script.

from datetime import timezone, datetime
import time


# Press ⌃R to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions, and settings.

def add_function(x, y):
    return x + y

def apply_function(func, x, y):
    return func(x, y)

class BankAccount:
    def __init__(self, owner, id_number, balance):
        self.owner = owner          # 1. Public：谁都可以看、可以改
        self._id_number = id_number  # 2. Protected：单下划线。警告外部别乱动，但其实能动
        self.__balance = balance    # 3. Private：双下划线。强制开启名字修饰保护

    def get_balance(self):
        # 类内部访问私有属性，完全合法
        return self.__balance

def print_hi(name):
    # Use a breakpoint in the code line below to debug your script.
    print(f'Hi, {name}')  # Press ⌘F8 to toggle the breakpoint.

    user_ages = {
        "Alice": 25,
        "Bob": 30,
        "Charlie": 35
    }

    for k in range(1, 5):
        user_ages[f"num_{k}"] = k ** 2

    print (user_ages)

    list_a = [1, 2, 3, 'c']
    list_a.__iter__()
    print(list_a)

    func = lambda x, y: x + y if x > y else -1
    print(func(1, 2))
    print(func(2, 2))
    print(func(3, 2))
    print(func(4, 2))
    
def timer(func):
    def wrapper(*args, **kwargs):

        start = time.time()
        print(time.perf_counter() - start)
        result = func(*args, **kwargs)



        end = time.time()

        duration = end - start
        print(round(duration, 2))
        print(round(duration, 6))
        print(round(duration, 10))

        return result
    return wrapper

@timer
def order_processing(order_id):
    print(f"order_id={order_id}")

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    print_hi('PyCharm')

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
