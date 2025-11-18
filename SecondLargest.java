public class SecondLargest {

    public static int secondLargestUnique(int[] arr) {
        // If array length < 2, second largest cannot exist
        if (arr == null || arr.length < 2) return -1;

        Integer largest = null;
        Integer secondLargest = null;

        for (int num : arr) {
            if (largest == null || num > largest) {
                // Update secondLargest before overriding largest
                if (largest != null && !largest.equals(num)) {
                    secondLargest = largest;
                }
                largest = num;
            } 
            else if (num != largest) {
                if (secondLargest == null || num > secondLargest) {
                    secondLargest = num;
                }
            }
        }

        return secondLargest == null ? -1 : secondLargest;
    }

    // Test the function
    public static void main(String[] args) {
        int[] input1 = {3, 5, 2, 5, 6, 6, 1};
        int[] input2 = {7, 7, 7};

        System.out.println(secondLargestUnique(input1)); // Output: 5
        System.out.println(secondLargestUnique(input2)); // Output: -1
    }
}
