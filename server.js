const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const scripts = `

#-----------------------------
#PYQ
#------------------------------

# Create simulator
set ns [new Simulator]

# Trace files
set tf [open out.tr w]
$ns trace-all $tf

set nf [open out.nam w]
$ns namtrace-all $nf

# Create nodes
set s1 [$ns node]   ;# Source1
set s2 [$ns node]   ;# Source2
set r1 [$ns node]   ;# R1
set r2 [$ns node]   ;# R2
set r3 [$ns node]   ;# R3
set d  [$ns node]   ;# Sink

# Links (as per diagram)
$ns duplex-link $s1 $r1 1Mb 100ms DropTail
$ns duplex-link $s2 $r1 1Mb 100ms DropTail

$ns duplex-link $r1 $r2 2.5Mb 40ms DropTail
$ns duplex-link $r2 $d  2.5Mb 40ms DropTail

$ns duplex-link $r1 $r3 0.5Mb 100ms DropTail
$ns duplex-link $r3 $d  0.5Mb 100ms DropTail

# Queue limits
$ns queue-limit $s1 $r1 10
$ns queue-limit $s2 $r1 10
$ns queue-limit $r1 $r2 10
$ns queue-limit $r2 $d 10
$ns queue-limit $r1 $r3 10
$ns queue-limit $r3 $d 10

# TCP Agents
set tcp1 [new Agent/TCP]
set tcp2 [new Agent/TCP]

# Sinks
set sink1 [new Agent/TCPSink]
set sink2 [new Agent/TCPSink]

# Attach agents
$ns attach-agent $s1 $tcp1
$ns attach-agent $s2 $tcp2
$ns attach-agent $d $sink1
$ns attach-agent $d $sink2

# Connect flows
$ns connect $tcp1 $sink1
$ns connect $tcp2 $sink2

# Set flow IDs (important)
$tcp1 set fid_ 1
$tcp2 set fid_ 2

# Set colors (for NAM)
$ns color 1 Blue
$ns color 2 Red

# FTP Applications
set ftp1 [new Application/FTP]
$ftp1 attach-agent $tcp1

set ftp2 [new Application/FTP]
$ftp2 attach-agent $tcp2

# Start/Stop times
$ns at 1.0 "$ftp1 start"
$ns at 19.0 "$ftp1 stop"

$ns at 1.1 "$ftp2 start"
$ns at 19.1 "$ftp2 stop"

# Link failure (R1-R2 at 5 sec)
$ns rtmodel-at 5.0 down $r1 $r2

# Finish at 20 sec
$ns at 20.0 "finish"

# Finish procedure
proc finish {} {
    global ns tf nf
    $ns flush-trace
    close $tf
    close $nf
    exec nam out.nam &
    exit 0
}

# Run
$ns run

#---------------------------
#AWK
#---------------------------

BEGIN {
    r2_packets = 0;
    r3_packets = 0;
    sink_packets = 0;
    total_bytes = 0;
}

{
    event = $1;
    time  = $2;
    from  = $3;
    to    = $4;
    size  = $6;

    # Count packets through R2 (node id 3 typically)
    if (event == "r" && to == 3) {
        r2_packets++;
    }

    # Count packets through R3 (node id 4 typically)
    if (event == "r" && to == 4) {
        r3_packets++;
    }

    # Packets received at sink (node id 5)
    if (event == "r" && to == 5) {
        sink_packets++;
        total_bytes += size;
    }
}

END {
    sim_time = 20;  # given in question
    throughput = (total_bytes * 8) / sim_time;

    print "Packets via R2:", r2_packets;
    print "Packets via R3:", r3_packets;
    print "Packets received at Sink:", sink_packets;
    print "Total Throughput (bps):", throughput;
}

#---------------------------
#pyq2
#---------------------------

# Create simulator
set ns [new Simulator]

# Trace files
set tf [open out.tr w]
$ns trace-all $tf

set nf [open out.nam w]
$ns namtrace-all $nf

# Create nodes
set s1 [$ns node]   ;# Source1
set s2 [$ns node]   ;# Source2
set r1 [$ns node]   ;# R1
set r2 [$ns node]   ;# R2
set r3 [$ns node]   ;# R3
set d  [$ns node]   ;# Sink

# Links (same as diagram)
$ns duplex-link $s1 $r1 1Mb 100ms DropTail
$ns duplex-link $s2 $r1 1Mb 100ms DropTail

$ns duplex-link $r1 $r2 2.5Mb 40ms DropTail
$ns duplex-link $r2 $d  2.5Mb 40ms DropTail

$ns duplex-link $r1 $r3 0.5Mb 100ms DropTail
$ns duplex-link $r3 $d  0.5Mb 100ms DropTail

# Queue limits
$ns queue-limit $s1 $r1 10
$ns queue-limit $s2 $r1 10
$ns queue-limit $r1 $r2 10
$ns queue-limit $r2 $d 10
$ns queue-limit $r1 $r3 10
$ns queue-limit $r3 $d 10

# UDP Agents
set udp1 [new Agent/UDP]
set udp2 [new Agent/UDP]

# Null sinks
set null1 [new Agent/Null]
set null2 [new Agent/Null]

# Attach agents
$ns attach-agent $s1 $udp1
$ns attach-agent $s2 $udp2
$ns attach-agent $d $null1
$ns attach-agent $d $null2

# Connect flows
$ns connect $udp1 $null1
$ns connect $udp2 $null2

# Flow IDs (important)
$udp1 set fid_ 1
$udp2 set fid_ 2

# Colors
$ns color 1 Blue
$ns color 2 Red

# CBR traffic (IMPORTANT PARAMETERS)
set cbr1 [new Application/Traffic/CBR]
$cbr1 attach-agent $udp1
$cbr1 set packetSize_ 100000      ;# 100KB
$cbr1 set rate_ 500k              ;# 5 packets/sec × 100KB ≈ 500 kbps

set cbr2 [new Application/Traffic/CBR]
$cbr2 attach-agent $udp2
$cbr2 set packetSize_ 100000
$cbr2 set rate_ 500k

# Start/Stop times
$ns at 1.0 "$cbr1 start"
$ns at 19.0 "$cbr1 stop"

$ns at 1.1 "$cbr2 start"
$ns at 19.1 "$cbr2 stop"

# Link failure
$ns rtmodel-at 5.0 down $r1 $r2

# End simulation
$ns at 20.0 "finish"

# Finish procedure
proc finish {} {
    global ns tf nf
    $ns flush-trace
    close $tf
    close $nf
    exec nam out.nam &
    exit 0
}

# Run
$ns run

#---------------------------
#awk
#---------------------------

BEGIN {
    sent = 0;
    received = 0;
    dropped = 0;
}

{
    event = $1;
    from  = $3;
    to    = $4;

    # Count packets sent (from sources 0 and 1)
    if (event == "+" && (from == 0 || from == 1)) {
        sent++;
    }

    # Count packets received at sink (node 5)
    if (event == "r" && to == 5) {
        received++;
    }

    # Count dropped packets
    if (event == "d") {
        dropped++;
    }
}

END {
    pdr = received / sent;

    print "Packets Sent:", sent;
    print "Packets Received:", received;
    print "Packets Dropped:", dropped;
    print "Packet Delivery Ratio (PDR):", pdr;
}


# ---------------------------------------------------------
# ques.tcl  template
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
