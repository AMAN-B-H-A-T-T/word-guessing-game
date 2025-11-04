import { Socket, Server } from "socket.io";

class SocketUtilities {
  public io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setUpSocket();
  }

  private setUpSocket() {
    this.io.on("connect", (socket: Socket) => {
      socket.on("join_game", (message) => {
        const { game_code: gameCode } = message;
        socket.join(gameCode);
      });
    });
  }
}

export default SocketUtilities;
