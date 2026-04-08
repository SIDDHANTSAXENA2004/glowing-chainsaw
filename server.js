const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const scripts = `
# ---------------------------------------------------------
# ques.tcl
# ---------------------------------------------------------
# Create Simulator
set ns [new Simulator]

# Open trace files
set nf [open even.nam w]
$ns namtrace-all $nf

set nt [open even.tr w]
$ns trace-all $nt

# Finish procedure
proc finish {} {
    global ns nf nt
    $ns flush-trace
    close $nf
    close $nt
    exec nam even.nam &
    exit 0
}

# Create 6 nodes
set n0 [$ns node]
set n1 [$ns node]
set n2 [$ns node]
set n3 [$ns node]
set n4 [$ns node]
set n5 [$ns node]

# Create links (bottleneck at n2-n3)
$ns duplex-link $n0 $n2 3Mb 10ms DropTail
$ns duplex-link $n1 $n2 3Mb 10ms DropTail
$ns duplex-link $n2 $n3 1Mb 20ms DropTail   
$ns duplex-link $n3 $n4 2Mb 15ms DropTail
$ns duplex-link $n3 $n5 2Mb 15ms DropTail

# Queue limit (to observe congestion)
$ns queue-limit $n2 $n3 10

# Coloring flows
$ns color 1 Blue
$ns color 2 Red

# TCP + FTP (n0 → n4)
set tcp [new Agent/TCP]
$tcp set fid_ 1
$ns attach-agent $n0 $tcp

set sink [new Agent/TCPSink]
$ns attach-agent $n4 $sink

$ns connect $tcp $sink

set ftp [new Application/FTP]
$ftp attach-agent $tcp

# UDP + CBR (n1 → n5)
set udp [new Agent/UDP]
$udp set fid_ 2
$ns attach-agent $n1 $udp

set null [new Agent/Null]
$ns attach-agent $n5 $null

$ns connect $udp $null

set cbr [new Application/Traffic/CBR]
$cbr attach-agent $udp
$cbr set packetSize_ 1000
$cbr set interval_ 0.005

# Start/Stop
$ns at 0.5 "$ftp start"
$ns at 1.0 "$cbr start"

$ns at 6.0 "$ftp stop"
$ns at 6.0 "$cbr stop"

# Finish
$ns at 6.5 "finish"

# Run
$ns run

#cbr
PacketSize_: constant size of packets generated e.g 48
rate_: sending rate e.g. 64kb
interval_: (optional) interval time between packets e.g 0.05
random_: Flag to introduce noise in the departure times; default is off, 1 for on
maxpkts_: the maximum number of packets to send e.g 1000
#exponential
set my_exp [new Application/Traffic/Exponential]
PacketSize_: constant size of packets generated e.g 210
burst_time_: average on time for the generator e.g. 500ms
idle_time_: average off time for the generator e.g 500ms
rate_: sending rate during the “on” time e.g. 100k
#pareto
set my_pareto [new Application/Traffic/Pareto]
PacketSize_: constant size of packets generated e.g. 210
burst_time_: average on time for the generator e.g. 500ms
idle_time_: average off time for the generator e.g. 500ms
rate_: sending rate during the “on” time e.g. 100k
shape_: the shape parameter used by the pareto distribution e.g. 1.5
#traffic trace
set t_file [new Tracefile]
$t_file filename <file>
set src [ new Application/Traffic/Trace]
$src attach-tracefile $t_file
#ftp
attach-agent: attach-agent: attaches an Application/FTP agent to an agent
start: start the Application/FTP to send data
stop: stop sending data
produce n: where n is the counter of packets to be sent
producemore n: where n is the new increased value of packets to be sent
send n: similar to producemore, but sends n bytes instead of packets
#telnet
set telnet [new Application/Telnet]
$telnet attach-agent $tcp
Parameters
start: start producing packets
stop: stop producing packets
attach-agent: attaches a Telnet object to an agent
# ---------------------------------------------------------
# delay.awk
# ---------------------------------------------------------
BEGIN {
    highest_packet_id = 0;
}
{
    action = $1;
    time = $2;
    packet_id = $12;

    if (packet_id > highest_packet_id)
        highest_packet_id = packet_id;

    if (start_time[packet_id] == 0)
        start_time[packet_id] = time;

    if (action == "r") {
        end_time[packet_id] = time;
    }
}
END {
    for (i = 0; i < highest_packet_id; i++) {
        if (end_time[i] > start_time[i]) {
            delay = end_time[i] - start_time[i];
            print start_time[i], delay;
        }
    }
}


# ---------------------------------------------------------
# stats.awk
# ---------------------------------------------------------
BEGIN {
    recv=0; drop=0; enqueue=0; dequeue=0;
}
{
    if ($1=="r") recv++;
    if ($1=="d") drop++;
    if ($1=="+") enqueue++;
    if ($1=="-") dequeue++;
}
END {
    printf("Received: %d\\n", recv);
    printf("Dropped: %d\\n", drop);
    printf("Enqueued: %d\\n", enqueue);
    printf("Dequeued: %d\\n", dequeue);
}


# ---------------------------------------------------------
# throughput.awk
# ---------------------------------------------------------
BEGIN { bytes=0; }
{
    if ($1=="r") {
        bytes += $6;
        time = $2;
    }
}
END {
    if (time > 0) {
        throughput = (bytes * 8) / time;
        print "Throughput (bps):", throughput;
    } else {
        print "Throughput (bps): 0";
    }
}
# ---------------------------------------------------------
# Running File Tricks (Terminal Commands)
# ---------------------------------------------------------
# 1. Run the TCL simulation:
#    ns ques.tcl

# 2. Run the Delay AWK script:
#    awk -f delay.awk even.tr > delay.txt

# 3. View the graph for delay:
#    xgraph delay.txt

# 4. Run the Stats AWK script:
#    awk -f stats.awk even.tr

# 5. Run the Throughput AWK script:
#    awk -f throughput.awk even.tr







//threading server
from socket import *
import threading

serverPort = 12000
serverSocket = socket(AF_INET, SOCK_STREAM)
serverSocket.bind(("", serverPort))
serverSocket.listen(5)

print("Server is ready...")

clients = []

# Function to handle each client
def handle_client(connectionSocket, addr):
    print(f"New connection from {addr}")
    clients.append(connectionSocket)

    while True:
        try:
            message = connectionSocket.recv(1024).decode()
            if not message:
                break

            print(f"{addr}: {message}")

            # Broadcast message to all clients
            for client in clients:
                if client != connectionSocket:
                    client.send(f"{addr}: {message}".encode())

        except:
            break

    print(f"Connection closed: {addr}")
    clients.remove(connectionSocket)
    connectionSocket.close()


# Accept multiple clients
while True:
    connectionSocket, addr = serverSocket.accept()
    thread = threading.Thread(target=handle_client, args=(connectionSocket, addr))
    thread.start()



//client
from socket import *
import threading

serverName = 'localhost'
serverPort = 12000

clientSocket = socket(AF_INET, SOCK_STREAM)
clientSocket.connect((serverName, serverPort))

print("Connected to chat server...")

# Receive messages from server
def receive_messages():
    while True:
        try:
            message = clientSocket.recv(1024).decode()
            print("\n" + message)
        except:
            break

# Start receiving thread
thread = threading.Thread(target=receive_messages)
thread.start()

# Send messages
while True:
    msg = input()
    clientSocket.send(msg.encode())









//serverudp
from socket import *
import time


serverSocket = socket(AF_INET, SOCK_DGRAM)

serverPort = 13000

serverSocket.bind(("", serverPort))

print("UDP Server is ready...")

while True:
    # Receive request
    message, clientAddress = serverSocket.recvfrom(1024)
    print("Request received from:", clientAddress)

    
    current_time = time.ctime(time.time())

    
    serverSocket.sendto(current_time.encode(), clientAddress)


//client
from socket import *

clientSocket = socket(AF_INET, SOCK_DGRAM)

serverName = 'localhost'
serverPort = 13000

message = "Give me time"
clientSocket.sendto(message.encode(), (serverName, serverPort))

modifiedMessage, serverAddress = clientSocket.recvfrom(1024)

print("Current Time:", modifiedMessage.decode())

clientSocket.close()








//server

from socket import *


serverSocket = socket(AF_INET, SOCK_STREAM)

serverPort = 12000

serverSocket.bind(("", serverPort))

serverSocket.listen(1)

print("Server is ready...")

while True:
    print("Waiting for connection...")
    connectionSocket, addr = serverSocket.accept()

    try:
        message = connectionSocket.recv(1024).decode()
        print("Received IP:", message)

     
        try:
            hostname = gethostbyaddr(message)[0]
        except:
            hostname = "Hostname not found"

        
        connectionSocket.send(hostname.encode())

        connectionSocket.close()

    except Exception as e:
        print("Error:", e)
        connectionSocket.close()



//client
from socket import *

clientSocket = socket(AF_INET, SOCK_STREAM)

serverName = 'localhost'
serverPort = 12000

clientSocket.connect((serverName, serverPort))

ip = input("Enter IP address: ")

clientSocket.send(ip.encode())

hostname = clientSocket.recv(1024).decode()

print("Hostname is:", hostname)

clientSocket.close()

`;

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(scripts);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
