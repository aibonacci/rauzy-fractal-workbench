/**
 * Demonstration of Configuration File Persistence
 * This script shows how the enhanced configuration system works
 */

import { ConfigManager } from './ConfigManager';
import { DEFAULT_CONFIG } from './defaultConfig';

async function demonstrateFilePersistence() {
  console.log('🔧 Configuration File Persistence Demo\n');

  // Create a configuration manager
  const configManager = new ConfigManager({
    configPath: './demo-config.json',
    enableValidation: true,
    createBackup: true,
    formatJson: true,
    onConfigChange: (config, errors) => {
      console.log('📝 Configuration changed:', { version: config.version, errors });
    },
    onValidationError: (errors, warnings) => {
      console.log('⚠️  Validation issues:', { errors, warnings });
    },
    onFileError: (error, operation) => {
      console.log(`❌ File ${operation} error:`, error);
    }
  });

  try {
    // Initialize the configuration manager
    console.log('1. Initializing configuration manager...');
    const initResult = await configManager.initialize();
    console.log('   ✅ Initialization result:', {
      isValid: initResult.isValid,
      isDefaultCreated: initResult.isDefaultCreated,
      errorsCount: initResult.errors.length,
      warningsCount: initResult.warnings.length
    });

    // Check if config file exists
    console.log('\n2. Checking configuration file existence...');
    const exists = await configManager.configFileExists();
    console.log('   📁 Config file exists:', exists);

    // Get file metadata
    if (exists) {
      console.log('\n3. Getting file metadata...');
      const metadata = await configManager.getConfigFileMetadata();
      console.log('   📊 File metadata:', {
        size: metadata.size,
        lastModified: metadata.lastModified?.toISOString(),
        isReadable: metadata.isReadable,
        isWritable: metadata.isWritable
      });
    }

    // Update configuration
    console.log('\n4. Updating configuration...');
    const updateResult = configManager.update({
      version: '2.0.0-demo',
      app: {
        ...DEFAULT_CONFIG.app,
        points: {
          ...DEFAULT_CONFIG.app.points,
          default: 75000
        }
      }
    });
    console.log('   🔄 Update result:', {
      isValid: updateResult.isValid,
      newVersion: updateResult.config.version,
      newDefaultPoints: updateResult.config.app.points.default
    });

    // Save configuration to file
    console.log('\n5. Saving configuration to file...');
    const saveResult = await configManager.save();
    console.log('   💾 Save result:', {
      success: saveResult.success,
      backupCreated: saveResult.backupCreated,
      backupPath: saveResult.backupPath
    });

    // Demonstrate validation
    console.log('\n6. Testing validation with invalid data...');
    const invalidResult = configManager.update({
      app: {
        ...DEFAULT_CONFIG.app,
        points: {
          min: -1, // Invalid: negative minimum
          max: 0,  // Invalid: zero maximum
          step: 0, // Invalid: zero step
          default: -1 // Invalid: negative default
        }
      }
    });
    console.log('   🔍 Validation result:', {
      isValid: invalidResult.isValid,
      errorsCount: invalidResult.errors.length
    });

    // Get current configuration
    console.log('\n7. Current configuration summary...');
    const currentConfig = configManager.getConfig();
    console.log('   📋 Current config:', {
      version: currentConfig.version,
      lastModified: currentConfig.lastModified,
      pointsDefault: currentConfig.app.points.default,
      isManagerReady: configManager.isReady()
    });

    // Demonstrate backup cleanup
    console.log('\n8. Cleaning up old backups...');
    const cleanupResult = await configManager.cleanupBackups(3);
    console.log('   🧹 Cleanup result:', {
      cleaned: cleanupResult.cleaned,
      error: cleanupResult.error
    });

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateFilePersistence().catch(console.error);
}

export { demonstrateFilePersistence };