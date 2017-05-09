import java.io.BufferedReader; 
import java.io.IOException; 
import java.io.InputStreamReader; 
import java.io.PrintWriter; 
import java.net.Socket; 
import java.net.UnknownHostException; 

public class TestApp { 
	// socket object 
	private Socket socket = null; 
	
	// make the connection with the socket 
	private void socketConnect(String ip, int port) throws UnknownHostException, IOException { 
		System.out.println("[Connecting to socket...]"); 
		this.socket = new Socket(ip, port); 
	} 
	
	// writes and receives the full message int the socket (String) 
	public String echo(String message) { 
		try { 
			// out & in 
			PrintWriter out = new PrintWriter(getSocket().getOutputStream(), true); 
			BufferedReader in = new BufferedReader(new InputStreamReader(getSocket().getInputStream())); 
			// writes str in the socket and read 
			out.println(message); 
			String returnStr = in.readLine(); 
			return returnStr; 
		} catch (IOException e) { 
			e.printStackTrace(); 
		} 
		return null; 
	} 
	
	// get the socket instance 
	private Socket getSocket() { 
		return socket; 
	}
	
	// ----------------
	
	public static void main(String[] args) throws UnknownHostException, IOException, ClassNotFoundException { 
		// class instance 
		TestApp client = new TestApp(); 
		// socket tcp connection 
		String ip = "127.0.0.1"; 
		int port = 6969; 
		client.socketConnect(ip, port); 
		// writes and receives the message 
		String message = "message123"; 
		System.out.println("Sending: " + message); 
		String returnStr = client.echo(message); 
		System.out.println("Receiving: " + returnStr); 
		
		// look out for output
		BufferedReader in = new BufferedReader(new InputStreamReader(client.getSocket().getInputStream())); 
		String myStr = in.readLine(); 
		System.out.println("Got: " + myStr); 
	}
}