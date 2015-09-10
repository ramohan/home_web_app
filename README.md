# Hubble Web App

## Local Installation

### Setup

To ease the development process, a Dockerfile is included that will
setup a Hubble container for you, without the need to install anything
on your local machine. In order to so, first build the local Hubble
image for Docker, from the project root:

```bash
docker build -t hubble .
```

### Development Mode

Once the image has been built, start an instance, mounting the volume at
runtime to enable the live editing of files. For instance, from within
the current working directory of the Hubble source code, execute the
following command:

```bash
docker run --name hubble-dev \
  -v $(pwd)/webapp:/hubble/webapp \
  -p 8888:8888 -d hubble
```

This will automatically start the Python Tornado server and enable the
developer to access the container via port `8888`. If you are on Linux,
this will now be available at `localhost:8888`. If you are using
_boot2docker_, you will need to replace `localhost` with your VM IP
address, found via the `boot2docker ip` command.

### Staging Mode

To preview the changes intended to occur on the staging and production
servers, create another instance configured for staging:

```bash
docker run --name hubble-staging \
  -v $(pwd)/webapp:/hubble/webapp \
  -e ENV=staging \
  -p 8889:8888 -d hubble
```

## Server/Production Installation

1. System packages, Python, and Python modules

  1. For CentOS and Amazon AMI, install these packages as root.

    ```bash
    yum install git libxml2-devel openssl-devel readline-devel bzip2 \
      bzip2-devel zlib-devel sqlite sqlite-devel patch
    ```

    After this point root privileges will not be needed again until you 
    are setting up a firewall rule for the web server.

  2. Install pyenv for managing python environments. This is necessary 
    in order to safely use any custom version of python without running 
    the risk of breaking system tools which depend upon the system 
    python install. 

    Note that in step 1, the system packages are installed as root. pyenv
    installs a local python environments in userland, so all steps for now
    on should be performed as a user and not as root. Do not install pyenv
    as root. Once all necessary packages are installed, you should won't 
    need root for any more commands.

    ```bash
    curl https://raw.github.com/yyuu/pyenv-installer/master/bin/pyenv-installer | bash
    ```

    Append to ~/.bashrc or ~/.bash_profile:

    ```bash
    export PYENV_ROOT="${HOME}/.pyenv"

    if [ -d "${PYENV_ROOT}" ]; then
      export PATH="${PYENV_ROOT}/bin:${PATH}"
      eval "$(pyenv init -)"
    fi

    export cfg="/home/ec2-user/webapp/config"
    ```

    Once this is done, restart your shell session and install python.

    ```bash
    pyenv install 2.7.6
    ```

    If your python build fails, it is probably because you are missing
    required packages.

    https://github.com/yyuu/pyenv/wiki/Common-build-problems

    Once 2.7.6 is installed, switch to it with:

    ```bash
    echo "2.7.6" >> ~/.pyenv/version
    ```

    You now have python, setuptools and pip installed safely in userland
    and are ready to run the app.

  3. Install required python modules.

    ```bash
    pip install tornado requests simplejson rjsmin rcssmin
    pip supervisor --pre
    ```

2. Application

  1. Make a directory in home and clone the repository:

    ```bash
    cd ~
    mkdir webapp
    git clone https://github.com/monitoreverywhere/HubbleWebApp.git webapp
    ```

  2. On Amazon AMI, forward incoming port 80 to local port 8888 in iptables.

    ```bash
    sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8888
    ```

    Alternatively you can open port 8888 or 80 and start the server on 
    that port instead. 

    On centOS, edit /etc/sysconfig/iptables:

    ```bash
    # if in development
    -A INPUT -p tcp --dport 8888 -j ACCEPT
    # in in production
    -A INPUT -p tcp --dport 80 -j ACCEPT
    ```

  3. Set the environment:

    ```bash
    echo "dev" >> config/env
    ```

  4. Navigate to the webapp directory and run 'npm install' to install 
    additional modules. LESS compilation will be handled through Grunt.js 
    with the option to enable the Watch module.

    There should be no other post-checkout configuration. The only file 
    not under version control is the "env" file, as the checked-out code 
    itself should contain configuration information for all supported 
    environments.

3. Start the HTTP Server

  1. Assuming you added the code snippet to .bash_profile or .bashrc in 
    step 1.2, you can start supervisor using:

    ```bash
    supervisord -c $cfg/supervisord.conf
    ```

  2. Controlling the server with supervisorctl.
    http://www.onurguzel.com/supervisord-restarting-and-reloading/

    ```bash
    # If you change config
    supervisorctl -c $cfg/supervisord.conf reread
    supervisorctl -c $cfg/supervisord.conf update
    supervisorctl -c $cfg/supervisord.conf start hubble_server
    supervisorctl -c $cfg/supervisord.conf stop hubble_server
    supervisorctl -c $cfg/supervisord.conf restart hubble_server

    ```

## Browser Compatibility

IE >= 8, Firefox, Opera, Safari

Apps cover Android and IOS Browser, so mobile support is not a priority.


## Coding Style

### All Languages

Lines should be no longer than 80 characters, exceptions should be rare. 
Long lines should be refactored with temporary variables, which also 
helps to improve readability of code.

All code files should use size 4 real tabs. Please do not replace tabs 
with spaces.

### Javascript

Local variable names should be lower case, with words separated by 
underscores. Object methods and class names should be camelcased.

Javascript should be object oriented and use global variables only 
when there is no viable alternative. Functionality should be divided 
between reusable objects as much as possible, and contained in 
modules which can be loaded by requireJS.

### Python

Follow the PEP 8 style guide, except we use tabs instead of spaces.

http://legacy.python.org/dev/peps/pep-0008/
