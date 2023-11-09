abstract class Person {
    private name: string

    // #name:string
    abstract introduce(): void
}

class Student extends Person {

    introduce(): void {
    }
}
