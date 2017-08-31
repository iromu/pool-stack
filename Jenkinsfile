node('node') {
    currentBuild.result = "SUCCESS"

    try {

       stage('Checkout'){
          checkout scm
       }

        stage('Initialize') {
          echo 'Initializing...'
          def node = tool name: 'Node-8.4.0', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
          env.PATH = "${node}/bin:${env.PATH}"
          sh 'node -v'
          sh 'yarn install'
        }

       stage('Build'){
         sh 'node -v'
         sh 'yarn build'
       }

       stage('Test'){
             sh 'yarn ci-test'
       }

        post {
            always {
                archive "target/**/*"
                junit 'target/test-reports.xml'
            }
        }
    }
    catch (err) {
        currentBuild.result = "FAILURE"
        throw err
    }

}
