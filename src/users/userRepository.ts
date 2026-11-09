export interface User {
  id: number;
  email: string;
  username: string;
}

const SEED_USERS: User[] = [
  { id: 1, email: "john@example.com", username: "John_Doe" },
  { id: 2, email: "kasia@example.com", username: "kasia_w" },
];

let users: User[] = [];

export const userRepository = {
  findByEmail(email: string): User | undefined {
    return users.find((u) => u.email === email);
  },

  findByUsername(username: string): User | undefined {
    return users.find((u) => u.username === username);
  },

  create(data: Omit<User, "id">): User {
    const user: User = { id: users.length + 1, ...data };
    users.push(user);
    return user;
  },

  // Przywraca repozytorium do danych początkowych. Używane w testach.
  reset(): void {
    users = SEED_USERS.map((u) => ({ ...u }));
  },
};

userRepository.reset();
