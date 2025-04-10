# Use the official Ubuntu image
FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

# Install SSH server and other dependencies
RUN apt-get update && \
    # echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    # apt-get update && \
    apt-get install -y lsof openssh-server sudo nano iputils-ping curl gnupg && \
    mkdir -p /var/run/sshd

# Modify SSH configuration for password authentication and root login
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Set up root password (optional, you can customize this or leave it blank for SSH key auth)
RUN echo 'root:rootpassword' | chpasswd

# Expose SSH port
EXPOSE 22

# Start SSH service
CMD ["/usr/sbin/sshd", "-D"]
