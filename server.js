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

#---------------------------------------------

# Step0: Create Simulator
set ns [new Simulator]

# Trace files
set tr [open out.tr w]
$ns trace-all $tr

set nam [open out.nam w]
$ns namtrace-all $nam

# Step1: Create Nodes
set n0 [$ns node]
set n1 [$ns node]
set n2 [$ns node]
set n3 [$ns node]

# Links
$ns duplex-link $n0 $n2 1Mb 10ms DropTail
$ns duplex-link $n1 $n2 1Mb 10ms DropTail
$ns duplex-link $n2 $n3 500Kb 20ms DropTail  ;# bottleneck

# Step2: Agents

# UDP (CBR)
set udp [new Agent/UDP]
$ns attach-agent $n0 $udp

set null [new Agent/Null]
$ns attach-agent $n3 $null

$ns connect $udp $null
$udp set fid_ 0

# TCP (FTP)
set tcp [new Agent/TCP]
$ns attach-agent $n1 $tcp

set sink [new Agent/TCPSink]
$ns attach-agent $n3 $sink

$ns connect $tcp $sink
$tcp set fid_ 1

# Step3: Applications

# CBR over UDP
set cbr [new Application/Traffic/CBR]
$cbr attach-agent $udp
$cbr set rate_ 200Kb
$cbr set packetSize_ 512

# FTP over TCP
set ftp [new Application/FTP]
$ftp attach-agent $tcp

# Step4: Scheduling
$ns at 1.0 "$cbr start"
$ns at 1.5 "$ftp start"
$ns at 4.0 "$ftp stop"
$ns at 4.5 "$cbr stop"

# Finish procedure
proc finish {} {
    global ns tr nam
    $ns flush-trace
    close $tr
    close $nam
    exec nam out.nam &
    exit 0
}

$ns at 5.0 "finish"

# Run simulation
$ns run

#--------------------------------------------------------

set ns [new Simulator]

set nf [open even.nam w]
$ns namtrace-all $nf

set nt [open even.tr w]
$ns trace-all $nt

# Nodes
set n0 [$ns node]
set n1 [$ns node]
set n2 [$ns node]
set n3 [$ns node]
set n4 [$ns node]
set n5 [$ns node]

# Links
$ns duplex-link $n0 $n1 2Mb 15ms DropTail
$ns duplex-link $n1 $n2 2Mb 15ms DropTail
$ns duplex-link $n2 $n3 2Mb 15ms DropTail
$ns duplex-link $n3 $n5 2Mb 15ms DropTail
$ns duplex-link $n2 $n5 2Mb 15ms DropTail
$ns duplex-link $n4 $n5 2Mb 15ms DropTail

# CBR (N0 → N4)
set udp0 [new Agent/UDP]
$ns attach-agent $n0 $udp0

set null0 [new Agent/Null]
$ns attach-agent $n4 $null0

$ns connect $udp0 $null0

set cbr0 [new Application/Traffic/CBR]
$cbr0 attach-agent $udp0
$cbr0 set interval_ 0.005

# FTP (N1 → N4)
set tcp1 [new Agent/TCP]
$ns attach-agent $n1 $tcp1

set sink1 [new Agent/TCPSink]
$ns attach-agent $n4 $sink1

$ns connect $tcp1 $sink1

set ftp1 [new Application/FTP]
$ftp1 attach-agent $tcp1

# CBR (N2 → N4)
set udp2 [new Agent/UDP]
$ns attach-agent $n2 $udp2

set null2 [new Agent/Null]
$ns attach-agent $n4 $null2

$ns connect $udp2 $null2

set cbr2 [new Application/Traffic/CBR]
$cbr2 attach-agent $udp2
$cbr2 set interval_ 0.005

# Timing
$ns at 1.0 "$cbr0 start"
$ns at 1.5 "$ftp1 start"
$ns at 2.0 "$cbr2 start"

$ns at 6.0 "finish"

proc finish {} {
    global ns nf nt
    $ns flush-trace
    close $nf
    close $nt
    exec nam even.nam &
    exit 0
}

$ns run


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

#average.awk
BEGIN {
        highest_packet_id=0;
}

{
        action = $1; time = $2; from = $3; to = $4; type = $5; pktsize = $6; flow_id = $8; src = $9;dst = $10; seq_no = $11; packet_id = $12;
        if ( packet_id > highest_packet_id )
                highest_packet_id = packet_id;
        if ( start_time[packet_id] == 0 )
                start_time[packet_id] = time;
        if( action == "r" ) {
                end_time[packet_id] = time;
        } else {
                end_time[packet_id] = -1;
        }
}

END {

        for(packet_id=0; packet_id < highest_packet_id; packet_id++)
        {
                start = start_time[packet_id];
                end =end_time[packet_id];
                packet_duration = end-start;
                if( start < end )
                        printf("%f %f\n",start, packet_duration);
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


#----------------------------------------------------------
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

#------------------------------------------------------------


#define trigPin 6
#define echoPin 7
#define greenPin 9
#define bluePin 10
#define r 11

long duration;
float distance;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(r,OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);

  Serial.begin(9600);
}

void loop() {
  // Trigger pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read echo
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;

  int brightness = map(distance, 2, 100, 255, 50);
  brightness = constrain(brightness, 50, 255);

  if (distance < 20) {
    // GREEN
   analogWrite(r,0);
    analogWrite(greenPin, brightness);
    analogWrite(bluePin, 0);
  }
  else if(distance <60){
   analogWrite(r,brightness);
    analogWrite(greenPin,0 );
    analogWrite(bluePin, 0);
  }
  else {
    // BLUE
    analogWrite(r,0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, brightness);
  }


  delay(200);
}

---------------------------------------------


 int arr[]={13,12,11,10,9};
void setup()
{
  for(auto i:arr){pinMode(i, OUTPUT);}


}

void loop()
{
int animationSpeed = 100;
 
  for(auto i:arr){
    digitalWrite(i, HIGH);
delay(animationSpeed); 
digitalWrite(i, LOW);
delay(animationSpeed);
  }
}

`;

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(scripts);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
