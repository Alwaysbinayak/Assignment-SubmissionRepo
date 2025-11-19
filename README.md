# DSA Task – Second Largest Unique Number

## Approach
I scanned the array once using two variables `largest` and `secondLargest`.  
While iterating, I updated both values only when unique numbers appeared.  
This ensures O(n) time complexity and O(1) space.

## Time Complexity
O(n)

## Sample Input
[3, 5, 2, 5, 6, 6, 1]

## Sample Output
5

## How to Run
javac SecondLargest.java
java SecondLargest
